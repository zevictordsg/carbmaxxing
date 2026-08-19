"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/input";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-6 w-full max-w-sm">
      <div>
        <FieldLabel htmlFor="displayName">Nome</FieldLabel>
        <Input
          id="displayName"
          name="displayName"
          placeholder="Como podemos te chamar"
          autoComplete="name"
          required
        />
        {state?.errors?.displayName && (
          <p className="mt-2 text-xs text-muted">{state.errors.displayName[0]}</p>
        )}
      </div>

      <div>
        <FieldLabel htmlFor="email">E-mail</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
          required
        />
        {state?.errors?.email && (
          <p className="mt-2 text-xs text-muted">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <FieldLabel htmlFor="password">Senha</FieldLabel>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          required
        />
        {state?.errors?.password && (
          <p className="mt-2 text-xs text-muted">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="text-xs text-muted border-l border-white/30 pl-3">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full mt-2">
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-xs text-muted text-center">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-white underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  );
}
