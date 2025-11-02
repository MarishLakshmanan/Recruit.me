// app/company/[id]/edit/EditCompanyNameForm.tsx
"use client";

import { useState, useTransition } from "react";
import { updateCompanyName } from "../actions";
import Link from "next/link";

export default function EditCompanyNameForm({
  companyId,
  initialName,
}: { companyId: string; initialName: string }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = async (formData: FormData) => {
    formData.set("name", name);
    setError(null);
    startTransition(async () => {
      try {
        await updateCompanyName(companyId, formData);
        window.location.href = `/company/${companyId}`;
      } catch (e: any) {
        setError(e?.message ?? "Failed to save");
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow">
      <label className="block text-sm font-medium">Company Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Link
          href={`/company/${companyId}`}
          className="rounded-md border px-4 py-2"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-70"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
