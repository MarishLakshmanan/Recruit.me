"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "app/actions/fetch";
import { useAuthContext } from "app/context/AuthContext";
import { ApplicantReport, ApplicantsReportResponse, FetchPayload } from "schema/schema";
import Pagination from "./Pagination";

const ApplicantsReport = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [applicants, setApplicants] = useState<ApplicantReport[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // Wait for auth to be confirmed before making requests
    if (authLoading || !isAuthenticated) {
      return;
    }

    const fetchApplicants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        searchParams.append("offset", ((currentPage - 1) * pageSize).toString());
        searchParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/admin/applicants?${searchParams.toString()}`,
          options: {
            method: "GET",
          },
        };

        const response = (await fetchWithAuth(payload)) as ApplicantsReportResponse;
        setApplicants(response.applicants || []);
        setTotalApplicants(response.total || 0);
      } catch (error) {
        console.error('Failed to fetch applicants:', error);
        setError('Error loading data');
        setApplicants([]);
        setTotalApplicants(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicants();
  }, [currentPage, pageSize, baseUrl, isAuthenticated, authLoading]);

  const totalPages = Math.ceil(totalApplicants / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">

        {applicants.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {applicant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {applicant.application_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {applicant.skills && applicant.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {applicant.skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex mr-1 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default ApplicantsReport;