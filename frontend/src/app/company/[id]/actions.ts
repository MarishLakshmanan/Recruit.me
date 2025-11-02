// app/company/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function updateCompanyName(companyId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();

  if (!name) throw new Error("Company name is required");
  if (name.length > 120) throw new Error("Company name is too long");

  revalidatePath(`/company/${companyId}`);
}
