// app/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { AuthPayload, LoginData, RegisterData } from "schema/auth";

export async function registerAction(data: RegisterData) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }));
      throw new Error(
        errorData.error || `Registration failed with status ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during registration");
  }
}

export async function loginAction(data: LoginData) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }));
      throw new Error(
        errorData.error || `Login failed with status ${response.status}`
      );
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

    return { success: true, role: payload.role };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during login");
  }
}
