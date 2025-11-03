// app/company/[id]/AddJobModal.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createJob } from "./actions";

export default function AddJobModal({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [draftSkill, setDraftSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);

  const show = () => { setOpen(true); dialogRef.current?.showModal(); };
  const close = () => { setOpen(false); dialogRef.current?.close(); setError(null); };

  useEffect(() => { if (open) setTimeout(() => skillInputRef.current?.focus(), 0); }, [open]);

  // skills chips
  const addSkill = () => {
    const v = draftSkill.trim();
    if (!v) return;
    if (!skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSkills((prev) => [...prev, v]);
    }
    setDraftSkill("");
  };
  const removeSkill = (s: string) => setSkills((p) => p.filter((x) => x !== s));
  const onSkillKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); }
    else if (e.key === "Backspace" && !draftSkill && skills.length) {
      setSkills((prev) => prev.slice(0, -1));
    }
  };

  // submit
  const onSubmit = async (formData: FormData) => {
    formData.set("title", title);
    formData.set("salary", salary);
    formData.set("description", description);
    formData.set("skills", JSON.stringify(skills));

    setError(null);
    startTransition(async () => {
      try {
        await createJob(companyId, formData);
        close();
        setTitle(""); setSalary(""); setDescription(""); setSkills([]); setDraftSkill("");
      } catch (e: any) {
        setError(e?.message ?? "Failed to create job");
      }
    });
  };

  return (
    <>
      <button
        onClick={show}
        className="rounded-md bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
      >
        Add Posting
      </button>

      <dialog
        ref={dialogRef}
        open={open}
        onClose={close}
        className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-black/40 p-0"
      >
        <div className="w-[480px] rounded-2xl bg-white p-6 shadow-xl">
          <form action={onSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold">Add Job</h2>

            {/* Job Title */}
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Frontend Engineer"
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
              />
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skills" className="mb-1 block text-sm font-medium text-gray-700">
                Skills
              </label>
              <input
                id="skills"
                ref={skillInputRef}
                value={draftSkill}
                onChange={(e) => setDraftSkill(e.target.value)}
                onKeyDown={onSkillKeyDown}
                placeholder="Type a skill and press Enter…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
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
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Salary */}
            <div>
              <label htmlFor="salary" className="mb-1 block text-sm font-medium text-gray-700">
                Salary
              </label>
              <input
                id="salary"
                type="number"
                min="0"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g., 120000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                Job Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of responsibilities, requirements, etc."
                className="w-full rounded-md border border-gray-300 p-3 outline-none focus:ring-2"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={close} className="rounded-md border px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-70"
              >
                {pending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
