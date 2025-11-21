"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "app/actions/fetch";
import { ApplicantForJob, ApplicantsForJobResponse, FetchPayload } from "schema/schema";
import Pagination from "./Pagination";
import RatingSelector from "./RatingSelector";
import Modal from "universal/Modal";

const ApplicantsList = ({
  jobId,
  jobTitle,
  onClose,
}: {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}) => {
  const [applicants, setApplicants] = useState<ApplicantForJob[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>({});
  const pageSize = 10;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // Reset to page 1 when jobId changes
  useEffect(() => {
    setCurrentPage(1);
  }, [jobId]);

  useEffect(() => {
    const fetchApplicants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        searchParams.append("offset", ((currentPage - 1) * pageSize).toString());
        searchParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/company/job/${jobId}/applicants?${searchParams.toString()}`,
          options: {
            method: "GET",
          },
        };

        const response = (await fetchWithAuth(payload)) as ApplicantsForJobResponse;
        setApplicants(response.applicants || []);
        setTotalApplicants(response.total || 0);
      } catch (error) {
        console.error('Failed to fetch applicants:', error);
        setError('Error loading applicants');
        setApplicants([]);
        setTotalApplicants(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId, currentPage, pageSize, baseUrl]);

  const handleRatingChange = async (
    applicantId: string,
    rating: 'hirable' | 'wait' | 'unacceptable' | 'unrated'
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
    } catch (error) {
      console.error('Failed to update rating:', error);
      alert('Failed to update rating. Please try again.');
    } finally {
      setRatingLoading({ ...ratingLoading, [applicantId]: false });
    }
  };

  const totalPages = Math.ceil(totalApplicants / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of modal content when page changes
    const modalContent = document.querySelector('[data-modal-content]');
    if (modalContent) {
      modalContent.scrollTop = 0;
    }
  };

  // Calculate pagination summary
  const getPaginationSummary = () => {
    if (totalApplicants === 0) return "No applicants";
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalApplicants);
    return `Showing ${start}-${end} of ${totalApplicants} applicant${totalApplicants !== 1 ? 's' : ''}`;
  };

  const getOfferStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
      none: { label: 'No Offer', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      offered: { label: 'Offer Extended', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      accepted: { label: 'Offer Accepted', color: 'text-green-700', bgColor: 'bg-green-100' },
      rejected: { label: 'Offer Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
    };

    const config = statusConfig[status] || statusConfig.none;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Modal onClose={onClose} className="w-[90%] max-w-4xl">
      <div className="p-6 max-h-[80vh] overflow-y-auto" data-modal-content>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Applicants for Job</h2>
            <p className="text-gray-600 mt-1">{jobTitle}</p>
            {!isLoading && !error && totalApplicants > 0 && (
              <p className="text-sm text-gray-500 mt-1">{getPaginationSummary()}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading applicants...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No applicants found for this job.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
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
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating:
                    </label>
                    <RatingSelector
                      currentRating={applicant.rating}
                      onRatingChange={(rating) => handleRatingChange(applicant.id, rating)}
                      isLoading={ratingLoading[applicant.id] || false}
                    />
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ApplicantsList;

