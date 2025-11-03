// app/company/[id]/jobs/new/AddJobForm.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createJob } from "../../actions";

type Props = { companyId: string };

export default function AddJobForm({ companyId }: Props) {
  const [title, setTitle] = useState("");
  const [draftSkill, setDraftSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const addSkill = (raw?: string) => {
    const v = (raw ?? draftSkill).trim();
    if (!v) return;
    const exists = skills.some((s) => s.toLowerCase() === v.toLowerCase());
    if (!exists) setSkills((prev) => [...prev, v]);
    setDraftSkill("");
  };

  const removeSkill = (s: string) =>
    setSkills((prev) => prev.filter((x) => x !== s));

  const onSkillsKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
    if (e.key === "Backspace" && !draftSkill && skills.length) {
      setSkills((prev) => prev.slice(0, -1));
    }
  };

  const onSkillsBlur = () => {
    if (draftSkill.trim()) addSkill();
  };

  const onSubmit = async (formData: FormData) => {
    formData.set("title", title.trim());
    formData.set("salary", salary.trim());
    formData.set("description", description.trim());
    formData.set("skills", JSON.stringify(skills));

    setError(null);
    startTransition(async () => {
      try {
        await createJob(companyId, formData);
        window.location.href = `/company/${companyId}`;
      } catch (e: any) {
        setError(e?.message ?? "Failed to create job");
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow">
      {/* Job title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Job title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Frontend Engineer"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
        />
      </div>

      {/* Skills  */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Skills</label>
        <input
          id="skills"
          value={draftSkill}
          onChange={(e) => setDraftSkill(e.target.value)}
          onKeyDown={onSkillsKeyDown}
          onBlur={onSkillsBlur}
          placeholder="Type a skill and press Enter…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
        />
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                className="rounded-full border border-indigo-200 bg-white px-2 leading-none hover:bg-red-50"
                aria-label={`Remove ${s}`}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
          {!skills.length && (
            <span className="text-sm text-gray-500">No skills added yet.</span>
          )}
        </div>
      </div>

      {/* Salary */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Salary</label>
        <input
          type="number"
          min="0"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="e.g., 120000"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
        />
      </div>

      {/* Job Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Job Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of responsibilities, requirements, etc."
          className="w-full rounded-md border border-gray-300 p-3 outline-none focus:ring-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between">
        <Link href={`/company/${companyId}`} className="rounded-md border px-4 py-2">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-70"
        >
          {pending ? "Submitting…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
