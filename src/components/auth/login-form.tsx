"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/input";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-6 w-full max-w-sm">
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
          placeholder="Sua senha"
          autoComplete="current-password"
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
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-xs text-muted text-center">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-white underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
