"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "app/actions/fetch";
import { FetchPayload, JobDetail, ApplicationStatus } from "schema/schema";
import ApplicationStatusComponent from "app/dashboard/Components/ApplicationStatus";
import JobActions from "app/dashboard/Components/JobActions";
import JobDescription from "app/dashboard/Components/JobDescription";
import Tag from "universal/Tag";
import Container from "universal/Container";

const JobDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const payload: FetchPayload = {
        url: `${process.env.NEXT_PUBLIC_API_URL}/applicant/job/${jobId}`,
        options: {
          method: "GET",
        },
      };
      //   const jobData = await fetchWithAuth(payload);
      const jobData: JobDetail = {
        id: "1",
        title: "Test Job",
        description: "Test Description",
        post_date: new Date().toISOString(),
        skills: ["Skill 1", "Skill 2"],
        applicationStatus: "Offer",
        applicant_count: 0,
        hired_count: 0,
        status: "open",
      };
      // Map application_status from backend to applicationStatus
      setJob({
        ...jobData,
        applicationStatus: (jobData.applicationStatus ||
          "Not Applied") as ApplicationStatus,
      });
    } catch (err) {
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobDetail();
    }
  }, [jobId]);

  const handleStatusChange = () => {
    fetchJobDetail();
  };

  if (isLoading) {
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
      <div>
        <h1 className="text-3xl font-bold mb-6">{job.title}</h1>

        <ApplicationStatusComponent
          status={job.applicationStatus || "Not Applied"}
        />

        <p className="text-gray-600 mb-4">
          Posted on: {new Date(job.post_date).toLocaleDateString()}
        </p>

        <JobActions
          status={job.applicationStatus || "Not Applied"}
          jobId={job.id}
          onStatusChange={handleStatusChange}
        />

        <JobDescription description={job.description} />

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Skills required:</h3>
          <div>
            {job.skills && job.skills.length > 0 ? (
              job.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)
            ) : (
              <p className="text-gray-500">No skills specified</p>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default JobDetailPage;
