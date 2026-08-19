import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Criar conta — Carbmaxxing",
};

export default function CadastroPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm flex flex-col items-center">
        <Link href="/" className="heading-tight-2 text-xl mb-1">
          Carbmaxxing<span className="align-super text-[10px]">®</span>
        </Link>
        <p className="label-loose text-[10px] text-muted-dim mb-10">
          by zevictor.gym
        </p>

        <h1 className="heading-tight text-3xl mb-8 text-center">
          Criar conta
        </h1>

        <SignupForm />
      </div>
    </main>
  );
}
