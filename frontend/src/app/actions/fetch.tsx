"use server";
import { cookies } from "next/headers";
import { AuthPayload } from "schema/auth";
import { FetchPayload, Role } from "schema/schema";

export async function fetchWithAuth(payload: FetchPayload, maxRetries = 3) {
  console.log("fetchWithAuth", payload);

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const cookieStore = await cookies();
      const storeCookie = cookieStore.get("token")?.value;
      if (!storeCookie) {
        throw new Error("Unauthorized: No authentication token");
      }
      const crumbs = JSON.parse(storeCookie) as AuthPayload;
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
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch { }
        }

        if (response.status === 401) {
          throw new Error(`Unauthorized: ${errorMessage}`);
        }

        if ((response.status === 404 || response.status === 500) && attempt < maxRetries) {
          lastError = new Error(errorMessage);
          const delay = Math.min(100 * Math.pow(2, attempt - 1) + Math.random() * 100, 1000);
          console.log(`Retry attempt ${attempt}/${maxRetries} for status ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(errorMessage);
      }
      const data = await response.json();

      return data;
    } catch (error) {
      lastError = error;

      const isUnauthorized = error instanceof Error &&
        (error.message.includes("Unauthorized") || error.message.includes("401"));

      if (attempt < maxRetries && !isUnauthorized) {
        const delay = Math.min(100 * Math.pow(2, attempt - 1) + Math.random() * 100, 1000);
        console.log(`Retry attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export async function getUserRole(maxRetries = 3): Promise<Role | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const cookieStore = await cookies();
      const storeCookie = cookieStore.get("token")?.value;
      if (!storeCookie) {
        console.error("Unauthorized");
        return null;
      }
      const crumbs = JSON.parse(storeCookie) as AuthPayload;
      return crumbs.role;
    } catch (error) {
      if (attempt < maxRetries && (error instanceof Error && error.message.includes("Unauthorized")) === false) {
        const delay = Math.min(100 * Math.pow(2, attempt - 1) + Math.random() * 100, 1000);
        console.log(`getUserRole retry attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return null;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  return { success: true };
}
