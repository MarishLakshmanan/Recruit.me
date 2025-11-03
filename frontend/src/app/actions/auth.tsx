// app/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { AuthPayload, LoginData, RegisterData } from "schema/auth";

export async function registerAction(data: RegisterData) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function loginAction(data: LoginData) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  const payload: AuthPayload = await response.json();
  const cookieStore = await cookies();

  cookieStore.set("token", JSON.stringify(payload), {
    path: "/",
    name: "token",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });

  return { success: true };
}
