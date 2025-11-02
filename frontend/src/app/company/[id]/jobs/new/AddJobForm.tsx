// app/company/[id]/jobs/new/AddJobForm.tsx
"use client";

import { useState, useTransition } from "react";
import { createJob } from "../../actions";
import Link from "next/link";

export default function AddJobForm({ companyId }: { companyId: string }) {
  const [title, setTitle] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [draftSkill, setDraftSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const addSkill = () => {
    const v = draftSkill.trim();
    if (!v) return;
    if (!skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSkills([...skills, v]);
    }
    setDraftSkill("");
  };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const onSubmit = async (formData: FormData) => {
    formData.set("title", title);
    formData.set("salary", salary);
    formData.set("description", description);
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
    <form action={onSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow">
      <div>
        <label className="mb-1 block text-sm font-medium">Job Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
          placeholder="e.g., Frontend Engineer"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Skills</label>
        <input
          value={draftSkill}
          onChange={(e) => setDraftSkill(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
          placeholder="Type a skill and press Enter"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                className="rounded-full border border-indigo-200 bg-white px-2 leading-none"
                aria-label={`Remove ${s}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Salary</label>
        <input
          type="number"
          min="0"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
          placeholder="e.g., 120000"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Job Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-3 outline-none focus:ring-2"
          placeholder="Brief summary of responsibilities, requirements, etc."
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
