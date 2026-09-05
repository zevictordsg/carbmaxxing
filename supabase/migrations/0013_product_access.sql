-- Carbmaxxing (área de membros) — acesso por produto, não mais tudo-ou-nada
--
-- Até agora has_content_access() era binário: qualquer assinatura active
-- liberava TUDO que estivesse is_locked=true. Com o funil vendendo dois
-- produtos diferentes (PDF grátis vs Calculadora paga, cada um liberando um
-- módulo diferente — quem compra a Calculadora recebe os dois), isso vira
-- um acesso por produto: `subscriptions.product` diz O QUE foi liberado, e
-- `modules.required_product` diz do que aquele módulo precisa.
--
-- Design decision: "quem compra a Calculadora também recebe o PDF" é
-- resolvido na hora de GRAVAR o acesso (a rota que processa a compra insere
-- as duas linhas, uma por produto) — não uma hierarquia dentro do SQL. Mais
-- simples de entender e de estender se um dia existir um terceiro produto
-- que não deva incluir os outros dois.
--
-- has_content_access() (a função antiga, ainda usada pelo gate de
-- content_items do modelo anterior) continua existindo com a MESMA
-- assinatura, mas passa a checar especificamente o produto 'calculadora'
-- (o único que é de fato uma compra paga) — sem isso, o cadastro grátis do
-- PDF acabaria liberando esse conteúdo antigo também, o que não é a intenção.

-- ============================================================================
-- subscriptions: qual produto cada linha libera
-- ============================================================================
alter table public.subscriptions add column if not exists product text not null default 'calculadora';

alter table public.subscriptions drop constraint if exists subscriptions_product_check;
alter table public.subscriptions add constraint subscriptions_product_check
  check (product in ('pdf', 'calculadora'));

-- Pagamento único (Stripe Checkout Session), não uma assinatura recorrente
-- de verdade -- guardamos o id da sessão em vez de reaproveitar
-- stripe_subscription_id (que continua existindo, pra quando/se algum
-- produto futuro for recorrente).
alter table public.subscriptions add column if not exists stripe_checkout_session_id text;

create unique index if not exists idx_subscriptions_checkout_session
  on public.subscriptions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- Um registro por (pessoa, produto) -- evita linha duplicada se o
-- /api/enroll ou o webhook rodar de novo pro mesmo e-mail (idempotência via
-- upsert on conflict, ver a rota que grava isso).
create unique index if not exists idx_subscriptions_profile_product
  on public.subscriptions (profile_id, product);

-- ============================================================================
-- modules: de qual produto cada módulo precisa
-- ============================================================================
alter table public.modules add column if not exists required_product text;

alter table public.modules drop constraint if exists modules_required_product_check;
alter table public.modules add constraint modules_required_product_check
  check (required_product is null or required_product in ('pdf', 'calculadora'));

-- ============================================================================
-- has_module_access(): substitui has_content_access() como o gate real dos
-- módulos/aulas -- checa o produto específico daquele módulo, não "qualquer
-- assinatura active".
-- ============================================================================
create or replace function public.has_module_access(p_module_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_admin()
    or not exists (
      select 1 from public.modules where id = p_module_id and is_locked = true
    )
    or exists (
      select 1
      from public.modules m
      join public.subscriptions s on s.product = m.required_product
      where m.id = p_module_id
        and s.profile_id = auth.uid()
        and s.status = 'active'
    );
$$;

grant execute on function public.has_module_access(uuid) to authenticated;

drop policy if exists "modules readable when unlocked or accessible" on public.modules;
create policy "modules readable when unlocked or accessible"
  on public.modules for select
  to authenticated
  using (is_locked = false or public.has_module_access(id));

drop policy if exists "lessons readable when parent module is accessible" on public.lessons;
create policy "lessons readable when parent module is accessible"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1 from public.modules m
      where m.id = module_id
        and (m.is_locked = false or public.has_module_access(m.id))
    )
  );

-- ============================================================================
-- has_content_access(): mantém a MESMA assinatura (sem argumentos) pro gate
-- antigo de content_items continuar funcionando sem tocar em 0010 -- só
-- restringe pra exigir especificamente o produto pago ('calculadora'), pra
-- quem só resgatou o PDF grátis não herdar esse acesso também.
-- ============================================================================
create or replace function public.has_content_access()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
    or exists (
      select 1 from public.subscriptions
      where profile_id = auth.uid() and status = 'active' and product = 'calculadora'
    );
$$;
