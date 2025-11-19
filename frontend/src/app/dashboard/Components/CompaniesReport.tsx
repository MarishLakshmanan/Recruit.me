"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "app/actions/fetch";
import { CompanyReport, CompaniesReportResponse, FetchPayload } from "schema/schema";
import Pagination from "./Pagination";

const CompaniesReport = () => {
  const [companies, setCompanies] = useState<CompanyReport[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        searchParams.append("offset", ((currentPage - 1) * pageSize).toString());
        searchParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/admin/companies?${searchParams.toString()}`,
          options: {
            method: "GET",
          },
        };

        const response = (await fetchWithAuth(payload)) as CompaniesReportResponse;
        setCompanies(response.companies || []);
        setTotalCompanies(response.total || 0);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        setError('Error loading data');
        setCompanies([]);
        setTotalCompanies(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [currentPage, pageSize, baseUrl]);

  const totalPages = Math.ceil(totalCompanies / pageSize);

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

        {companies.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Hired
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.job_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.application_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.hired_count}
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

export default CompaniesReport;