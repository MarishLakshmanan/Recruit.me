// app/company/[id]/jobs/new/AddJobForm.tsx
"use client";

import { useState } from "react";
import { CreateJob, FetchPayload, Job } from "schema/schema";
import { fetchWithAuth } from "app/actions/fetch";

export default function AddJobForm({
  closeModal,
  addJob,
}: {
  closeModal: () => void;
  addJob: (job: Job) => void;
  editJob: (job: Job) => void;
}) {
  const [title, setTitle] = useState("");
  const [draftSkill, setDraftSkill] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (skills.length === 0) {
      setError("Please add at least one skill");
      return;
    }

    setIsPending(true);
    setError(null);

    const trimmedDescription = description.trim();
    const createJob: CreateJob = {
      title: title.trim(),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      salary: parseFloat(salary.trim()),
      skills: skills.map((s) => s.trim()),
    };
    const payload: FetchPayload = {
      url: `${process.env.NEXT_PUBLIC_API_URL}/company/job`,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createJob),
      },
    };
    try {
      const response = await fetchWithAuth(payload);
      closeModal();
      const job: Job = {
        id: response.id,
        title: title.trim(),
        applicant_count: 0,
        hired_count: 0,
        post_date: new Date().toISOString(),
        status: "inactive",
      };
      addJob(job);
    } catch (error) {
      console.error("Failed to create job:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl bg-white p-6 shadow"
    >
      {/* Job title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Job title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Frontend Engineer"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
        />
      </div>

      {/* Skills  */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Skills
        </label>
        <input
          id="skills"
          value={draftSkill}
          onChange={(e) => setDraftSkill(e.target.value)}
          onKeyDown={onSkillsKeyDown}
          onBlur={onSkillsBlur}
          placeholder="Type a skill and press Enter.."
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
        <label className="block text-sm font-medium text-gray-700">
          Salary
        </label>
        <input
          type="number"
          min="0"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="e.g., 120000"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
        />
      </div>

      {/* Job Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Job Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of responsibilities, requirements, etc. (Optional)"
          className="w-full rounded-md border border-gray-300 p-3 outline-none focus:ring-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between">
        <button
          type="submit"
          onClick={closeModal}
          className="rounded-md border px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-70"
        >
          {isPending ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
