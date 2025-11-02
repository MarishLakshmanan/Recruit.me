"use client";

import Link from "next/link";
import { useCompanyState } from "./company-state";
import EditCompanyName from "./EditCompanyName";

export default function CompanyHeader({ companyId }: { companyId: string }) {
  const { name } = useCompanyState();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-semibold">{name}</h1>
      <div className="flex gap-3">
        {/* Inline modal (optimistic) */}
        <EditCompanyName companyId={companyId} />

        {/* Or keep your existing separate page flow as well */}
        <Link
          href={`/company/${companyId}/jobs/new`}
          className="rounded-xl bg-indigo-500 px-5 py-3 text-white hover:bg-indigo-600"
        >
          Add Posting
        </Link>
      </div>
    </div>
  );
}
