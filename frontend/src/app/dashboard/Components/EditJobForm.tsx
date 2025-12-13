"use client";

import { useEffect, useState } from "react";
import { CreateJob, FetchPayload, Job } from "schema/schema";
import { fetchWithAuth } from "app/actions/fetch";

type FullJobDetails = Job & {
  description?: string;
  salary?: number;
  skills?: string[];
};

export default function EditJobForm({
  jobId,
  closeModal,
  editJob,
}: {
  jobId: string;
  closeModal: () => void;
  editJob: (job: Job) => void;
}) {
  const [title, setTitle] = useState("");
  const [draftSkill, setDraftSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingJob, setExistingJob] = useState<FullJobDetails | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const payload: FetchPayload = {
          url: `${process.env.NEXT_PUBLIC_API_URL}/company/job/${jobId}`,
          options: {
            method: "GET",
          },
        };
        const jobData = (await fetchWithAuth(payload)) as FullJobDetails;
        console.log("jobData", jobData);
        setExistingJob(jobData);

        setTitle(jobData.title || "");
        setDescription(jobData.description || "");
        setSalary(jobData.salary?.toString() || "");
        setSkills(jobData.skills || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch job details for editing:", error);
        setError(error as string);
        setIsLoading(false);
        alert(error as string);
      }
    };
    fetchJobDetails();
  }, [jobId]);

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
    const updateJob: CreateJob = {
      title: title.trim(),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      salary: salary ? parseFloat(salary.trim()) : 0,
      skills: skills.map((s) => s.trim()),
    };

    const payload: FetchPayload = {
      url: `${process.env.NEXT_PUBLIC_API_URL}/company/job/${jobId}`,
      options: {
        method: "PUT",
        body: JSON.stringify(updateJob),
      },
    };

    try {
      await fetchWithAuth(payload);
      closeModal();

      const updatedJob: Job = {
        id: jobId,
        title: title.trim(),
        applicant_count: existingJob?.applicant_count || 0,
        hired_count: existingJob?.hired_count || 0,
        post_date: existingJob?.post_date || new Date().toISOString(),
        status: existingJob?.status || "inactive",
      };
      editJob(updatedJob);
    } catch (error) {
      console.error("Failed to update job:", error);
      setError(error as string);
      alert(error as string);
    }
    setIsPending(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-5 rounded-xl bg-white p-6 shadow">
        <p className="text-center text-gray-500">Loading job details...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl bg-white p-6 shadow"
    >
      <h2 className="text-lg font-semibold">Edit Job</h2>

      {/* Job title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Job title
        </label>
        <input
          value={title}
          disabled={isPending}
          required
          onChange={(e) => setTitle(e.target.value)}
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
          required
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="e.g., 120000"
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
          type="button"
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
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
