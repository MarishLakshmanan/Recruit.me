// app/company/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function updateCompanyName(companyId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Company name is required");
  if (name.length > 120) throw new Error("Company name is too long");
  // TODO: write to DB
  // await prisma.company.update({ where: { id: companyId }, data: { name } });
  revalidatePath(`/company/${companyId}`);
}

export async function createJob(companyId: string, formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const salaryRaw = (formData.get("salary") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const skillsJSON = formData.get("skills") as string | null;

  if (!title) throw new Error("Job title is required");
  if (!skillsJSON) throw new Error("At least one skill is required");

  let skills: string[] = [];
  try { skills = JSON.parse(skillsJSON); } catch { throw new Error("Invalid skills payload"); }

  const salary = salaryRaw ? Number(salaryRaw) : null;
  if (salaryRaw && (Number.isNaN(salary) || salary! < 0)) {
    throw new Error("Salary must be a positive number");
  }

  // TODO: write to DB
  // await prisma.job.create({ data: { companyId, title, salary, description, skills } });

  revalidatePath(`/company/${companyId}`);
}
