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
import RatingSelector from "app/dashboard/Components/RatingSelector";

type OfferStatusFilter = "all" | "offered" | "accepted";

const ReviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const [applicants, setApplicants] = useState<ApplicantForJob[]>([]);
  const [jobTitle, setJobTitle] = useState<string>("");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [offerStatusFilter, setOfferStatusFilter] =
    useState<OfferStatusFilter>("all");
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [withdrawLoading, setWithdrawLoading] = useState<
    Record<string, boolean>
  >({});
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

        // Fetch applicants filtered by offer status
        const searchParams = new URLSearchParams();
        searchParams.append(
          "offset",
          ((currentPage - 1) * pageSize).toString()
        );
        searchParams.append("limit", pageSize.toString());
        searchParams.append("offer_status", offerStatusFilter);

        const applicantsPayload: FetchPayload = {
          url: `${baseUrl}/company/job/${jobId}/applicants/by-offer-status?${searchParams.toString()}`,
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
  }, [jobId, currentPage, pageSize, baseUrl, userRole, offerStatusFilter]);

  const handleRatingChange = async (
    applicantId: string,
    rating: "hirable" | "wait" | "unacceptable" | "unrated"
  ) => {
    setRatingLoading({ ...ratingLoading, [applicantId]: true });

    try {
      const payload: FetchPayload = {
        url: `${baseUrl}/company/job/${jobId}/applicant/${applicantId}/rating`,
        options: {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rating }),
        },
      };

      await fetchWithAuth(payload);

      // Update local state optimistically
      setApplicants(
        applicants.map((applicant) =>
          applicant.id === applicantId ? { ...applicant, rating } : applicant
        )
      );
      setSuccessMessage("Rating updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update rating:", err);
      setError("Failed to update rating. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setRatingLoading({ ...ratingLoading, [applicantId]: false });
    }
  };

  const handleWithdrawOffer = async (applicantId: string) => {
    setWithdrawLoading({ ...withdrawLoading, [applicantId]: true });

    try {
      const payload: FetchPayload = {
        url: `${baseUrl}/company/job/${jobId}/applicant/${applicantId}/offer`,
        options: {
          method: "DELETE",
        },
      };

      await fetchWithAuth(payload);

      // Update local state optimistically
      setApplicants(
        applicants.map((applicant) =>
          applicant.id === applicantId
            ? { ...applicant, offer_status: "none" }
            : applicant
        )
      );
      setSuccessMessage("Offer withdrawn successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to withdraw offer:", err);
      setError("Failed to withdraw offer. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setWithdrawLoading({ ...withdrawLoading, [applicantId]: false });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filter: OfferStatusFilter) => {
    setOfferStatusFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
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
        label: "Hired",
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

        {/* Filter Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                offerStatusFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange("offered")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                offerStatusFilter === "offered"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Offered
            </button>
            <button
              onClick={() => handleFilterChange("accepted")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                offerStatusFilter === "accepted"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Hired
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading applicants...</div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">
              No applicants found for the selected filter.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="space-y-4">
                {applicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {applicant.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
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
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating:
                        </label>
                        <RatingSelector
                          currentRating={applicant.rating}
                          onRatingChange={(rating) =>
                            handleRatingChange(applicant.id, rating)
                          }
                          isLoading={ratingLoading[applicant.id] || false}
                          disabled={applicant.offer_status !== "none"}
                        />
                      </div>

                      {applicant.offer_status === "offered" && (
                        <div>
                          <Button
                            label={
                              withdrawLoading[applicant.id]
                                ? "Withdrawing..."
                                : "Withdraw Offer"
                            }
                            type="danger"
                            onClick={() => handleWithdrawOffer(applicant.id)}
                            disabled={withdrawLoading[applicant.id] || false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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

export default ReviewPage;
