"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookieName } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.parse({
    email: formData.get("email"),
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, parsed.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
  redirect("/login");
}
