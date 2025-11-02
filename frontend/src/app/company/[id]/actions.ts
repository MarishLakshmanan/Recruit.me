"use server";

import { revalidatePath } from "next/cache";

const fakeDb: Record<string, { name: string }> = {};

// ---- Edit Company Name ----
export async function updateCompanyName(companyId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required");

  await new Promise((r) => setTimeout(r, 500));

  fakeDb[companyId] = { name };
  revalidatePath(`/company/${companyId}`);

  return { id: companyId, name };
}

// ---- Create Job ----
export async function createJob(companyId: string, formData: FormData) {
  await new Promise((r) => setTimeout(r, 600));
  
  return { ok: true };
}
