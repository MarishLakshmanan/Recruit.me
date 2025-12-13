"use client";

import { useRouter } from "next/navigation";
import { Application } from "schema/schema";

type Props = {
  application: Application;
};

export default function ApplicationCard({ application }: Props) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/job/${application.job_id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      offered: "bg-blue-100 text-blue-800 border-blue-300",
      accepted: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };

    const colorClass = statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-300";

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md p-6 mb-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{application.job_title}</h3>
        {getStatusBadge(application.status)}
      </div>

      <p className="text-gray-700 mb-2">
        {application.company_name}
      </p>

      <p className="text-gray-600 text-sm mb-2">
        <span className="font-medium">Applied:</span> {formatDate(application.apply_date)}
      </p>

      {application.skills && application.skills.length > 0 && (
        <div className="mb-2">
          <span className="font-medium text-gray-700 text-sm">Skills: </span>
          <div className="flex flex-wrap gap-2 mt-1">
            {application.skills.map((skill) => (
              <span
                key={skill}
                className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-gray-600 text-sm">
        <span className="font-medium">{application.applicant_count}</span> applicants
      </p>
    </div>
  );
}
