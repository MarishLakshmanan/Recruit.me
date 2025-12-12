"use server";
import { cookies } from "next/headers";
import { AuthPayload } from "schema/auth";
import { FetchPayload, Role } from "schema/schema";

export async function fetchWithAuth(payload: FetchPayload) {
  console.log("fetchWithAuth", payload);

  const cookieStore = await cookies();
  const storeCokkie = cookieStore.get("token")?.value;
  if (!storeCokkie) {
    throw new Error("Unauthorized");
  }
  const crumbs = JSON.parse(storeCokkie) as AuthPayload;
  const headers = new Headers(payload.options.headers || {});

  headers.set("Authorization", `Bearer ${crumbs.token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(payload.url, { ...payload.options, headers });
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      try {
        const text = await response.text();
        errorMessage = text || errorMessage;
      } catch {
        // If we can't get text either, use the default message
      }
    }
    throw new Error(errorMessage);
  }
  const data = await response.json();

  return data;
}

export async function getUserRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  const storeCokkie = cookieStore.get("token")?.value;
  if (!storeCokkie) {
    return null; // Return null instead of throwing - missing token is a valid state
  }
  const crumbs = JSON.parse(storeCokkie) as AuthPayload;
  return crumbs.role;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  return { success: true };
}
