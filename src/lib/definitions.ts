import * as z from "zod";

export const SignupFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { error: "Use pelo menos 2 caracteres." })
    .max(60)
    .trim(),
  email: z.email({ error: "Digite um e-mail válido." }).trim(),
  password: z
    .string()
    .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." })
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z.email({ error: "Digite um e-mail válido." }).trim(),
  password: z.string().min(1, { error: "Digite sua senha." }),
});

export type AuthFormState =
  | {
      errors?: {
        displayName?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
