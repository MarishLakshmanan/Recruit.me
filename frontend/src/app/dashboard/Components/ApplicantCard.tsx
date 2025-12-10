"use client";

import { ApplicantReport } from "schema/schema";

type Props = {
  applicant: ApplicantReport;
};

export default function ApplicantCard({ applicant }: Props) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 transition-shadow border border-gray-200 hover:shadow-md">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-900">
          {applicant.name}
        </h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {applicant.application_count}{" "}
          {applicant.application_count === 1 ? "application" : "applications"}
        </span>
      </div>

      <p className="text-gray-700 mb-2">
        <span className="font-medium">Email:</span> {applicant.email}
      </p>

      <p className="text-gray-600 text-sm mb-3">
        <span className="font-medium">Member since:</span>{" "}
        {formatDate(applicant.created_at)}
      </p>

      {applicant.skills && applicant.skills.length > 0 && (
        <div>
          <span className="font-medium text-gray-700 text-sm">Skills:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {applicant.skills.map((skill) => (
              <span
                key={skill}
                className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded border border-blue-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
