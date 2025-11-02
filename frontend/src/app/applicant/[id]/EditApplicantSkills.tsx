// app/applicant/[id]/EditApplicantSkills.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateApplicantSkills } from "./actions";

type Props = {
  applicantId: string;
  initialSkills: string[];
};

export default function EditApplicantSkills({ applicantId, initialSkills }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [draft, setDraft] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const show = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => {
    setOpen(false);
    dialogRef.current?.close();
    setDraft("");
    setError(null);
  };

  // focus the input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const addSkill = () => {
    const val = draft.trim();
    if (!val) return;
    const exists = skills.some((s) => s.toLowerCase() === val.toLowerCase());
    if (!exists) setSkills((prev) => [...prev, val]);
    setDraft("");
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Backspace" && !draft && skills.length) {
      // backspace with empty input removes last chip (nice UX)
      setSkills((prev) => prev.slice(0, -1));
    }
  };

  const onSave = async (formData: FormData) => {
    setError(null);
    formData.set("skills", JSON.stringify(skills));
    startTransition(async () => {
      try {
        await updateApplicantSkills(applicantId, formData);
        close();
      } catch (e: any) {
        setError(e?.message ?? "Failed to save skills");
      }
    });
  };

  return (
    <>
      <button
        onClick={show}
        className="rounded-md bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
      >
        Edit Profile
      </button>

      <dialog
        ref={dialogRef}
        open={open}
        onClose={close}
        className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-black/40 p-0"
      >
        <div className="w-[640px] rounded-2xl bg-white p-6 shadow-xl">
          <form action={onSave}>
            <h2 className="mb-4 text-xl font-semibold">Skills Required</h2>

            {/* input */}
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Enter a skill and press Enter…"
              className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
            />

            {/* chips */}
            <div className="mb-4 flex flex-wrap gap-2">
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
              {!skills.length && (
                <span className="text-sm text-gray-500">No skills added yet.</span>
              )}
            </div>

            {error && (
              <p className="mb-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded-md border px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-70"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
