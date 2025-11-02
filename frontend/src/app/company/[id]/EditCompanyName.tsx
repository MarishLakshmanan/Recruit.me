"use client";

import { useRef, useState, useTransition } from "react";
import { updateCompanyName } from "./actions";
import { useCompanyState } from "./company-state";

export default function EditCompanyName({ companyId }: { companyId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { name: shownName, setName } = useCompanyState(); // what the header shows
  const [draft, setDraft] = useState(shownName);

  const show = () => {
    setDraft(shownName);
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => {
    setOpen(false);
    dialogRef.current?.close();
    setError(null);
  };

  const onSubmit = async (formData: FormData) => {
    // optimistic update
    const previous = shownName;
    const next = draft.trim() || previous;
    setName(next); // instantly reflect on the header

    setError(null);
    formData.set("name", next);

    startTransition(async () => {
      try {
        // call the (fake for now) server action
        await updateCompanyName(companyId, formData);
        close();
      } catch (e: any) {
        // rollback on failure
        setName(previous);
        setError(e?.message ?? "Something went wrong");
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
  <form
    action={onSubmit}
    className="bg-white rounded-xl p-6 shadow-lg w-[420px]"
  >
    <h2 className="mb-4 text-lg font-medium">Company Name</h2>
    <textarea
      rows={3}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      className="w-full rounded-md border border-gray-300 p-3 outline-none focus:ring-2"
    />
    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
        className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-70"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  </form>
</dialog>

    </>
  );
}
