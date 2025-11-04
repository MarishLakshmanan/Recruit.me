"use client";

import { ApplicantProfile } from "schema/schema";

export default function ApplicantHeader({
  applicant,
}: {
  applicant: ApplicantProfile;
}) {
  return <h1 className="text-3xl font-semibold">{applicant.name}</h1>;
}
