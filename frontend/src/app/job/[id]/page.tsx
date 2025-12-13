"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "app/actions/fetch";
import { useAuthContext } from "app/context/AuthContext";
import { FetchPayload, JobDetail, ApplicationStatus, Role, ApplicantForJob, ApplicantsForJobResponse } from "schema/schema";
import ApplicationStatusComponent from "app/dashboard/Components/ApplicationStatus";
import JobActions from "app/dashboard/Components/JobActions";
import JobDescription from "app/dashboard/Components/JobDescription";
import Tag from "universal/Tag";
import Container from "universal/Container";

const JobDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { role: userRole } = useAuthContext();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [applicants, setApplicants] = useState<ApplicantForJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetail = async () => {
    if (!userRole) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      let payload: FetchPayload;
      
      if (userRole === Role.COMPANY) {
        // Fetch job details for company
        payload = {
          url: `${baseUrl}/company/job/${jobId}`,
          options: {
            method: "GET",
          },
        };
        const jobData = await fetchWithAuth(payload);
        
        // Fetch applicants for this job
        const applicantsPayload: FetchPayload = {
          url: `${baseUrl}/company/job/${jobId}/applicants`,
          options: {
            method: "GET",
          },
        };
        const applicantsResponse = (await fetchWithAuth(applicantsPayload)) as ApplicantsForJobResponse;
        setApplicants(applicantsResponse.applicants || []);
        
        setJob({
          id: jobData.id,
          title: jobData.title,
          description: jobData.description,
          salary: jobData.salary,
          post_date: jobData.post_date,
          status: jobData.status,
          company_name: jobData.company_name,
          company_description: jobData.company_description,
          applicant_count: parseInt(jobData.applicant_count) || 0,
          hired_count: parseInt(jobData.hired_count) || 0,
          skills: jobData.skills || [],
        });
      } else {
        // Fetch job details for applicant
        payload = {
          url: `${baseUrl}/applicant/job/${jobId}`,
          options: {
            method: "GET",
          },
        };
        const jobData = await fetchWithAuth(payload);
        
        // Map application_status from backend to applicationStatus
        let applicationStatus: ApplicationStatus = "Not Applied";
        if (jobData.application_status) {
          switch (jobData.application_status) {
            case "Applied":
              applicationStatus = "Applied";
              break;
            case "Rejected":
              applicationStatus = "Rejected";
              break;
            case "Offer":
              applicationStatus = "Offer";
              break;
            case "Accepted":
              applicationStatus = "Accepted";
              break;
            default:
              applicationStatus = "Not Applied";
          }
        }
        
        setJob({
          id: jobData.id,
          title: jobData.title,
          description: jobData.description,
          salary: jobData.salary,
          post_date: jobData.post_date,
          status: "open",
          company_name: jobData.company_name,
          company_description: jobData.company_description,
          applicant_count: 0,
          hired_count: 0,
          skills: jobData.skills || [],
          applicationStatus,
        });
      }
    } catch (err) {
      console.error("Failed to fetch job details:", err);
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobId && userRole) {
      fetchJobDetail();
    }
  }, [jobId, userRole]);

  const handleStatusChange = () => {
    fetchJobDetail();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  if (isLoading || !userRole) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <p>Job not found</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-3">{job.title}</h1>

          {job.company_name && (
            <div className="mb-4 pb-4 border-b">
              <h2 className="text-xl font-semibold text-gray-700">
                {job.company_name}
              </h2>
              {job.company_description && (
                <p className="mt-2 text-gray-600 whitespace-pre-wrap">
                  {job.company_description}
                </p>
              )}
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-gray-600">
                Posted on: {new Date(job.post_date).toLocaleDateString()}
              </p>
            </div>
            {userRole === Role.COMPANY && job.salary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-shrink-0">
                <p className="text-sm text-gray-600 mb-1">Salary</p>
                <p className="text-xl font-bold text-blue-900">${job.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>
        </div>

        {userRole === Role.APPLICANT && (
          <div className="mb-6">
            <ApplicationStatusComponent
              status={job.applicationStatus || "Not Applied"}
            />
            <div className="mt-4">
              <JobActions
                status={job.applicationStatus || "Not Applied"}
                jobId={job.id}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        )}

        <div className="mb-6">
          <JobDescription description={job.description} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Skills required:</h3>
          <div className="flex flex-wrap gap-2">
            {job.skills && job.skills.length > 0 ? (
              job.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)
            ) : (
              <p className="text-gray-500">No skills specified</p>
            )}
          </div>
        </div>
      </div>

      {userRole === Role.COMPANY && applicants.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Applicants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applicants.map((applicant) => (
              <div
                key={applicant.id}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
              >
                <h3 className="font-semibold text-base mb-2">{applicant.name}</h3>
                {applicant.apply_date ? (
                  <p className="text-sm text-gray-700 mb-3">
                    Applied: {formatDate(applicant.apply_date)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">Applied date not available</p>
                )}
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
            ))}
          </div>
        </div>
      )}

      {userRole === Role.COMPANY && applicants.length === 0 && (
        <div className="mt-6 text-center py-8 text-gray-500">
          <p className="text-lg">No applicants found for this job.</p>
        </div>
      )}
    </Container>
  );
};

export default JobDetailPage;
