-- Carbmaxxing — gate genérico por produto pro conteúdo hand-edited
--
-- has_content_access() (0010, restrita em 0013 pro produto 'calculadora')
-- só cobre UM produto. Mas src/lib/modules-content.ts (a fonte real do
-- que aparece em /comunidade — ver comentário lá) agora tem dois módulos
-- com produtos diferentes: a Calculadora e o PDF. has_product_access(text)
-- generaliza isso: mesma lógica (admin OU assinatura active daquele
-- produto específico), parametrizada pelo produto, chamada por
-- src/app/comunidade/modulos/[id]/page.tsx com o `requiredProduct` de
-- cada módulo (default 'calculadora' quando não informado, pra manter o
-- comportamento de antes em módulos que não setarem o campo).

create or replace function public.has_product_access(p_product text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin()
    or exists (
      select 1 from public.subscriptions
      where profile_id = auth.uid() and status = 'active' and product = p_product
    );
$$;

grant execute on function public.has_product_access(text) to authenticated;
