"use server";
import { cookies } from "next/headers";
import { AuthPayload } from "schema/auth";
import { FetchPayload } from "schema/shcema";

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

  const response = await fetch(payload.url, { ...payload.options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  const data = await response.json();
  console.log("data", data);
  return data;
}
