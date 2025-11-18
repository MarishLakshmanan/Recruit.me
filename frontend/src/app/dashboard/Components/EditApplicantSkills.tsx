"use client";

import { fetchWithAuth } from "app/actions/fetch";
import { useRef, useState } from "react";
import { ApplicantProfile, Application, FetchPayload } from "schema/schema";

export default function EditApplicantSkills({
  applicant,
  onUpdate,
}: {
  applicant: ApplicantProfile;
  onUpdate?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [error, setError] = useState<string | null>(null);

  const [skills, setSkills] = useState<string[]>(applicant.skills);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);

  const show = () => {
    setInput("");
    setSkills(applicant.skills); // Refresh skills from prop
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
      // quick backspace remove
      removeSkill(skills[skills.length - 1]);
    }
  };

  const onSubmit = async () => {
    setIsPending(true);
    const payload: FetchPayload = {
      url: `${baseUrl}/applicant/profile`,
      options: {
        method: "PUT",
        body: JSON.stringify({ skills }),
      },
    };
    try {
      const data = await fetchWithAuth(payload);
      alert("Successfully updated skills");
      close();
      // Notify parent to refetch profile data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      alert(error as string);
      setError(error as string);
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
        <div className="bg-white rounded-xl p-6 shadow-lg w-[800px] max-h-[90vh] overflow-y-auto">
          <h2 className="mb-4 text-lg font-semibold">Skills Required</h2>

          {/* Input */}
          <input
            placeholder="Enter your skills and press Enter…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="mb-3 w-full rounded-md border border-blue-300 bg-blue-50/40 px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
          />

          {/* Chips */}
          <div className="flex flex-wrap gap-3 mb-6">
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

          {/* Applied Jobs Section */}
          {applicant.applications && applicant.applications.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h2 className="mb-4 text-lg font-semibold">Applied Jobs</h2>
              <div className="grid grid-cols-1 gap-3">
                {applicant.applications.map((application: Application) => {
                  const applyDate = new Date(application.apply_date);
                  const formattedDate = `${String(applyDate.getDate()).padStart(2, '0')}-${String(applyDate.getMonth() + 1).padStart(2, '0')}-${applyDate.getFullYear()}`;
                  
                  return (
                    <div
                      key={application.job_id}
                      className="bg-gray-100 rounded-lg p-4 border border-gray-200"
                    >
                      <h3 className="font-semibold text-base mb-2">
                        {application.job_title}
                      </h3>
                      <p className="text-sm text-gray-700 mb-1">
                        Company: {application.company_name}
                      </p>
                      <p className="text-sm text-gray-700">
                        Applied: {formattedDate}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-md border px-4 py-2 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-70 hover:bg-blue-700"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
