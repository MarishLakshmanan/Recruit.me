"use server";

import { revalidatePath } from "next/cache";

// fake in-memory store for demo
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

  // simulate latency
  await new Promise((r) => setTimeout(r, 500));

  // pretend save
  const existing = fakeDb[applicantId] || { name: "Applicant Name", skills: [] };
  fakeDb[applicantId] = { ...existing, skills };

  // when backend exists: await fetch(…)
  revalidatePath(`/applicant/${applicantId}`);
  return { id: applicantId, skills };
}
