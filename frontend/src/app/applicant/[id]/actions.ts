// app/applicant/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function updateApplicantSkills(applicantId: string, formData: FormData) {
  const raw = formData.get("skills") as string | null;
  if (!raw) throw new Error("No skills provided");

  let skills: string[];
  try {
    skills = JSON.parse(raw);
  } catch {
    throw new Error("Invalid skills payload");
  }

  // Normalize & validate
  const cleaned = Array.from(
    new Set(
      skills
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (s.length > 60 ? s.slice(0, 60) : s)) // cap length per skill
        .map((s) => s) // keep original case; change if you prefer
    )
  );

  if (cleaned.length > 50) {
    throw new Error("Too many skills (max 50).");
  }

  // TODO: persist to your DB, e.g. Prisma:
  // await prisma.applicant.update({
  //   where: { id: applicantId },
  //   data: { skills: cleaned },
  // });

  // Make the page show the new data
  revalidatePath(`/applicant/${applicantId}`);
}
