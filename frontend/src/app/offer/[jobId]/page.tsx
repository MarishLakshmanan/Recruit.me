"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth, getUserRole } from "app/actions/fetch";
import {
  FetchPayload,
  Role,
  ApplicantForJob,
  ApplicantsForJobResponse,
} from "schema/schema";
import Container from "universal/Container";
import Button from "universal/Button";
import Pagination from "app/dashboard/Components/Pagination";

const OfferPage = () => {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const [applicants, setApplicants] = useState<ApplicantForJob[]>([]);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(
    new Set()
  );
  const [jobTitle, setJobTitle] = useState<string>("");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const pageSize = 10;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const role = (await getUserRole()) as Role;
        setUserRole(role);
        if (role !== Role.COMPANY) {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to fetch role:", err);
        router.push("/login");
      }
    };
    fetchRole();
  }, [router]);

  useEffect(() => {
    if (userRole !== Role.COMPANY) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch job details
        const jobPayload: FetchPayload = {
          url: `${baseUrl}/company/job/${jobId}`,
          options: {
            method: "GET",
          },
        };
        const jobData = await fetchWithAuth(jobPayload);
        setJobTitle(jobData.title || "");

        // Fetch hirable applicants
        const searchParams = new URLSearchParams();
        searchParams.append(
          "offset",
          ((currentPage - 1) * pageSize).toString()
        );
        searchParams.append("limit", pageSize.toString());

        const applicantsPayload: FetchPayload = {
          url: `${baseUrl}/company/job/${jobId}/applicants/hirable?${searchParams.toString()}`,
          options: {
            method: "GET",
          },
        };
        const response = (await fetchWithAuth(
          applicantsPayload
        )) as ApplicantsForJobResponse;
        setApplicants(response.applicants || []);
        setTotalApplicants(response.total || 0);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load applicants. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [jobId, currentPage, pageSize, baseUrl, userRole]);

  const handleSelectApplicant = (applicantId: string) => {
    setSelectedApplicants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(applicantId)) {
        newSet.delete(applicantId);
      } else {
        newSet.add(applicantId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedApplicants.size === applicants.length) {
      setSelectedApplicants(new Set());
    } else {
      setSelectedApplicants(new Set(applicants.map((a) => a.id)));
    }
  };

  const handleOffer = async () => {
    if (selectedApplicants.size === 0) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: FetchPayload = {
        url: `${baseUrl}/company/job/${jobId}/applicants/offer`,
        options: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicantIds: Array.from(selectedApplicants),
          }),
        },
      };

      await fetchWithAuth(payload);
      setSuccessMessage(
        `Successfully extended offers to ${selectedApplicants.size} applicant(s)`
      );
      setSelectedApplicants(new Set());

      // Refresh the applicants list to update offer status
      const searchParams = new URLSearchParams();
      searchParams.append("offset", ((currentPage - 1) * pageSize).toString());
      searchParams.append("limit", pageSize.toString());

      const refreshPayload: FetchPayload = {
        url: `${baseUrl}/company/job/${jobId}/applicants/hirable?${searchParams.toString()}`,
        options: {
          method: "GET",
        },
      };
      const refreshResponse = (await fetchWithAuth(
        refreshPayload
      )) as ApplicantsForJobResponse;
      setApplicants(refreshResponse.applicants || []);
    } catch (err) {
      console.error("Failed to extend offers:", err);
      setError("Failed to extend offers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedApplicants(new Set()); // Clear selection on page change
  };

  const getOfferStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: string; bgColor: string }
    > = {
      none: {
        label: "No Offer",
        color: "text-gray-700",
        bgColor: "bg-gray-100",
      },
      offered: {
        label: "Offer Extended",
        color: "text-blue-700",
        bgColor: "bg-blue-100",
      },
      accepted: {
        label: "Offer Accepted",
        color: "text-green-700",
        bgColor: "bg-green-100",
      },
      rejected: {
        label: "Offer Rejected",
        color: "text-red-700",
        bgColor: "bg-red-100",
      },
    };

    const config = statusConfig[status] || statusConfig.none;
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const totalPages = Math.ceil(totalApplicants / pageSize);
  const allSelected =
    applicants.length > 0 && selectedApplicants.size === applicants.length;

  if (userRole !== Role.COMPANY) {
    return null;
  }

  return (
    <Container>
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Review Applicants
          </h1>
          <p className="text-gray-600">{jobTitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading applicants...</div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No hirable applicants found for this job.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All
                    </span>
                  </label>
                  <span className="text-sm text-gray-500">
                    {selectedApplicants.size} selected
                  </span>
                </div>
                <Button
                  label={
                    isSubmitting
                      ? "Extending Offers..."
                      : `Offer (${selectedApplicants.size})`
                  }
                  type="primary"
                  onClick={handleOffer}
                  disabled={selectedApplicants.size === 0 || isSubmitting}
                />
              </div>

              <div className="space-y-4">
                {applicants.map((applicant) => {
                  const isSelected = selectedApplicants.has(applicant.id);
                  const hasOffer = applicant.offer_status !== "none";

                  return (
                    <div
                      key={applicant.id}
                      className={`border rounded-lg p-4 transition-shadow ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectApplicant(applicant.id)}
                          disabled={hasOffer}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {applicant.name}
                            </h3>
                            {getOfferStatusBadge(applicant.offer_status)}
                          </div>
                          {applicant.skills && applicant.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {applicant.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                          {hasOffer && (
                            <p className="text-sm text-gray-500 mt-2">
                              This applicant already has an offer
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {totalPages > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </Container>
  );
};

export default OfferPage;
