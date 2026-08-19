"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LoginFormSchema,
  SignupFormSchema,
  type AuthFormState,
} from "@/lib/definitions";

export async function signup(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validatedFields = SignupFormSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { displayName, email, password } = validatedFields.data;
  const supabase = await createClient();

  // profiles.display_name is populated by the handle_new_user trigger
  // (see supabase/migrations/0001_init.sql) from this metadata.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { message: "Já existe uma conta com esse e-mail." };
    }
    return { message: "Não foi possível criar sua conta. Tente novamente." };
  }

  // If the Supabase project has "Confirm email" turned on (the default),
  // signUp() creates the user but returns no session until they click the
  // confirmation link -- redirecting to a protected route here would just
  // bounce them straight to /login. Show a "check your inbox" message
  // instead. With confirmation OFF, a session comes back immediately and
  // we send them straight in.
  if (!data.session) {
    return {
      message:
        "Conta criada! Confirme seu e-mail (a gente mandou um link) antes de entrar.",
    };
  }

  redirect("/comunidade");
}

export async function login(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        message:
          "Confirme seu e-mail antes de entrar (a gente mandou um link na hora do cadastro).",
      };
    }
    return { message: "E-mail ou senha incorretos." };
  }

  redirect("/comunidade");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
