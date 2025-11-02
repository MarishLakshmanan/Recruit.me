"use client";

import { useState, useRef, useTransition } from "react";
import { updateCompanyName } from "./actions";

type Props = {
  companyId: string;
  initialName: string;
};

export default function EditCompanyName({ companyId, initialName }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => {
    setOpen(false);
    dialogRef.current?.close();
  };

  const onSubmit = async (formData: FormData) => {
    formData.set("name", name);
    setError(null);

    startTransition(async () => {
      try {
        await updateCompanyName(companyId, formData);
        close(); 
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong");
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{initialName}</h1>
        <button
          onClick={() => {
            setOpen(true);
            dialogRef.current?.showModal();
          }}
          className="rounded-md bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
        >
          Edit Profile
        </button>
      </div>

      <dialog
        ref={dialogRef}
        open={open}
        onClose={close}
        className="rounded-xl p-0 backdrop:bg-black/40"
      >
        <form action={onSubmit} className="w-[420px] p-6">
          <h2 className="mb-4 text-lg font-medium">Company Name</h2>

          <label htmlFor="company-name" className="sr-only" >
            Company Name
          </label>
          <textarea
            id="company-name"
            name="name"
            rows={3}
            placeholder="Value"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 outline-none focus:ring-2"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

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
              {pending ? "Saving…" : "Submit"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
