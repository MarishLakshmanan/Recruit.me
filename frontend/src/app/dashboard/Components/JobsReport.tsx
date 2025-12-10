"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "app/actions/fetch";
import {
  CompanyReport,
  CompaniesReportResponse,
  JobReport,
  JobsReportResponse,
  FetchPayload,
} from "schema/schema";
import Pagination from "./Pagination";

const JobsReport = () => {
  const [companies, setCompanies] = useState<CompanyReport[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [jobs, setJobs] = useState<JobReport[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      setError(null);

      try {
        const payload: FetchPayload = {
          url: `${baseUrl}/admin/companies?limit=1000`,
          options: {
            method: "GET",
          },
        };

        const response = (await fetchWithAuth(
          payload
        )) as CompaniesReportResponse;
        setCompanies(response.companies || []);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        setError("Error loading data");
        setCompanies([]);
      } finally {
        setCompaniesLoading(false);
      }
    };

    fetchCompanies();
  }, [baseUrl]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!selectedCompanyId) {
        setJobs([]);
        setTotalJobs(0);
        return;
      }

      setJobsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        searchParams.append(
          "offset",
          ((currentPage - 1) * pageSize).toString()
        );
        searchParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/admin/company/${selectedCompanyId}/jobs?${searchParams.toString()}`,
          options: {
            method: "GET",
          },
        };

        const response = (await fetchWithAuth(payload)) as JobsReportResponse;
        setJobs(response.jobs || []);
        setTotalJobs(response.total || 0);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        setError("Error loading data");
        setJobs([]);
        setTotalJobs(0);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [selectedCompanyId, currentPage, pageSize, baseUrl]);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalJobs / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-red-100 text-red-800 border-red-200";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const selectedCompanyName = companies.find(
    (c) => c.id === selectedCompanyId
  )?.name;

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div>
            <select
              value={selectedCompanyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={companiesLoading}
            >
              <option value="">
                {companiesLoading ? "Loading..." : "Select a company"}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-8 text-center text-red-500">{error}</div>
        ) : !selectedCompanyId ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Select a company above
          </div>
        ) : jobsLoading ? (
          <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Applicants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Hired
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.applicant_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.hired_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCompanyId && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default JobsReport;
