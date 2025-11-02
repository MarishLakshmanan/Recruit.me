"use client";

import { useApplicantState } from "./applicant-state";
import EditApplicantSkills from "./EditApplicantSkills";

export default function ApplicantHeader({ applicantId }: { applicantId: string }) {
  const { name } = useApplicantState();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-semibold">{name}</h1>
      <div className="flex gap-3">
        <EditApplicantSkills applicantId={applicantId} />
      </div>
    </div>
  );
}
