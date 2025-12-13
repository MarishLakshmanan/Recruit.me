"use client";

import { fetchWithAuth } from "app/actions/fetch";
import { useRef, useState } from "react";
import { ApplicantProfile, FetchPayload } from "schema/schema";

export default function EditApplicantProfile({
  applicant,
  onProfileUpdate,
}: {
  applicant: ApplicantProfile;
  onProfileUpdate?: (updates: { name?: string; skills?: string[] }) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState<string>(applicant.name);
  const [skills, setSkills] = useState<string[]>(applicant.skills);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);

  const show = () => {
    setName(applicant.name);
    setSkills(applicant.skills);
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
    if (skills.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setSkills([...skills, v]);
    setInput("");
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((x) => x !== s));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(input);
    } else if (e.key === "Backspace" && input === "" && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  const onSubmit = async () => {
    setIsPending(true);
    const payload: FetchPayload = {
      url: `${baseUrl}/applicant/profile`,
      options: {
        method: "PUT",
        body: JSON.stringify({ name, skills }),
      },
    };
    try {
      await fetchWithAuth(payload);
      if (onProfileUpdate) {
        onProfileUpdate({ name, skills });
      }
      close();
    } catch (error) {
      console.error("Failed to update applicant profile:", error);
      alert(error as string);
    } finally {
      setIsPending(false);
    }
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
        <div className="bg-white rounded-xl p-6 shadow-lg w-[700px] max-h-[90vh] overflow-y-auto">
          <h2 className="mb-4 text-lg font-semibold">Edit Profile</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
              placeholder="Your name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <input
              placeholder="Enter your skills and press Enter.."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="mb-3 w-full rounded-md border border-blue-300 bg-blue-50/40 px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
            />

            <div className="flex flex-wrap gap-3">
              {skills.map((s) => (
                <span
                  key={s}
                  className="group inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-800 shadow-sm"
                >
                  <span className="font-medium">{s}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    aria-label={`Remove ${s}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-300 bg-blue-100 text-blue-700 transition
                     hover:bg-blue-200 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-70"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
