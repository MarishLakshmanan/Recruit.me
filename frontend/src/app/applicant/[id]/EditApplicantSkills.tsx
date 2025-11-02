"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateApplicantSkills } from "./actions";
import { useApplicantState } from "./applicant-state";

export default function EditApplicantSkills({ applicantId }: { applicantId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { skills, setSkills } = useApplicantState();
  const [draftSkills, setDraftSkills] = useState<string[]>(skills);
  const [input, setInput] = useState("");

  useEffect(() => setDraftSkills(skills), [skills]);

  const show = () => {
    setDraftSkills(skills);
    setInput("");
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => {
    setOpen(false);
    dialogRef.current?.close();
    setError(null);
  };

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v) return;
    if (draftSkills.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setDraftSkills([...draftSkills, v]);
    setInput("");
  };

  const removeSkill = (s: string) => {
    setDraftSkills(draftSkills.filter((x) => x !== s));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(input);
    } else if (e.key === "Backspace" && input === "" && draftSkills.length > 0) {
      // quick backspace remove
      removeSkill(draftSkills[draftSkills.length - 1]);
    }
  };

  const onSubmit = async () => {
    // optimistic
    const prev = skills;
    setSkills(draftSkills);

    const fd = new FormData();
    fd.set("skills", JSON.stringify(draftSkills));

    startTransition(async () => {
      try {
        await updateApplicantSkills(applicantId, fd);
        close();
      } catch (e: any) {
        setSkills(prev); // rollback
        setError(e?.message ?? "Failed to save skills");
      }
    });
  };

  return (
    <>
      <button
        onClick={show}
        className="rounded-xl bg-indigo-500 px-5 py-3 text-white hover:bg-indigo-600"
      >
        Edit Profile
      </button>

      <dialog
        ref={dialogRef}
        open={open}
        onClose={close}
        className="p-0 backdrop:bg-black/40"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          border: "none",
          padding: 0,
          background: "transparent",
        }}
      >
        <div className="bg-white rounded-xl p-6 shadow-lg w-[560px]">
          <h2 className="mb-4 text-lg font-semibold">Skills Required</h2>

          {/* Input */}
          <input
            placeholder="Enter your skills and press Enter…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
          />

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {draftSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="rounded-full border px-1.5 leading-none"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={pending}
              className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-70"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
