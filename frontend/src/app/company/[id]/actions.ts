"use server";

import { revalidatePath } from "next/cache";

// Fake DB layer for now
const fakeDb: Record<string, { name: string }> = {};

// ---- Edit Company Name ----
export async function updateCompanyName(companyId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required");

  // simulate network latency
  await new Promise((r) => setTimeout(r, 500));

  // pretend to "save"
  fakeDb[companyId] = { name };

  // when backend exists: POST to your API, then revalidate
  revalidatePath(`/company/${companyId}`);

  // return saved value (useful if you want to sync)
  return { id: companyId, name };
}

// ---- Create Job (kept for your existing forms) ----
export async function createJob(companyId: string, formData: FormData) {
  // You already call this from AddJobForm/AddJobModal
  // For now, just wait a bit and succeed.
  await new Promise((r) => setTimeout(r, 600));
  // When backend exists, do the fetch here and then:
  // revalidatePath(`/company/${companyId}`);
  return { ok: true };
}
