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
  const { error } = await supabase.auth.signUp({
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
    return { message: "E-mail ou senha incorretos." };
  }

  redirect("/comunidade");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
