"use server";

import { revalidatePath } from "next/cache";

const fakeDb: Record<string, { name: string; skills: string[] }> = {};

export async function updateApplicantSkills(
  applicantId: string,
  formData: FormData
) {
  const raw = formData.get("skills") as string; // JSON stringified array
  let skills: string[] = [];
  try {
    skills = JSON.parse(raw) as string[];
  } catch {
    throw new Error("Invalid skills payload");
  }

  await new Promise((r) => setTimeout(r, 500));

  const existing = fakeDb[applicantId] || { name: "Applicant Name", skills: [] };
  fakeDb[applicantId] = { ...existing, skills };

  revalidatePath(`/applicant/${applicantId}`);
  return { id: applicantId, skills };
}
