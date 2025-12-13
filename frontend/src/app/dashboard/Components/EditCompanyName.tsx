"use client";

import { fetchWithAuth } from "app/actions/fetch";
import { useRef, useState } from "react";
import { FetchPayload } from "schema/schema";

export default function EditCompanyName({
  companyName,
  changeName,
}: {
  companyName: string;
  changeName: (string: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const [name, setName] = useState(companyName);

  const show = () => {
    setName(companyName);
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => {
    setOpen(false);
    dialogRef.current?.close();
    setError(null);
  };

  const onSubmit = async (formData: FormData) => {
    setPending(true);
    const payload: FetchPayload = {
      url: `${baseUrl}/company/profile`,
      options: {
        method: "PUT",
        body: JSON.stringify({ name }),
      },
    };
    try {
      const data = await fetchWithAuth(payload);
      changeName(name);
    } catch (error) {
      console.error("Failed to update company name:", error);
      alert(error as string);
    }
    setPending(false);
    close();
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              disabled={isPending}
              className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-70"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
