import { fetchWithAuth } from "app/actions/fetch";
import ApplicantHeader from "app/dashboard/Components/ApplicantHeader";
import EditApplicantSkills from "app/dashboard/Components/EditApplicantSkills";
import { useEffect, useState } from "react";
import {
  ApplicantProfile,
  FetchPayload,
  Job,
  SearchJobsResponse,
} from "schema/schema";
import JobCard from "../Components/JobCard";

const applicant = () => {
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  useEffect(() => {
    const fetchProfile = async () => {
      let payload: FetchPayload = {
        url: `${baseUrl}/applicant/profile`,
        options: {
          method: "GET",
        },
      };
      const profile = await fetchWithAuth(payload);
      setProfile(profile as ApplicantProfile);
      setIsLoading(false);

      payload = {
        url: `${baseUrl}/jobs/search`,
        options: {
          method: "GET",
        },
      };
      const jobs = (await fetchWithAuth(payload)) as SearchJobsResponse;
      console.log("jobs", jobs);
      setJobs(jobs.jobs as Job[]);
    };
    fetchProfile();
  }, []);

  function editJob(job: Job) {
    setJobs(jobs.map((j) => (j.id === job.id ? job : j)));
  }
  if (isLoading) {
    return <h1>isLoading</h1>;
  }
  if (profile) {
    return (
      <main className="flex flex-col h-full">
        <div className="flex flex-row gap-4 items-center justify-between">
          <ApplicantHeader applicant={profile} />
          <EditApplicantSkills applicant={profile} />
        </div>

        <div className="mt-8 space-y-4 flex-1 shadow-md rounded-lg p-4">
          {jobs.length === 0 ? (
            <div className="text-center text-gray-500">No jobs found</div>
          ) : (
            jobs.map((job) => (
              <JobCard key={job.id} job={job} editJob={editJob} />
            ))
          )}
        </div>
      </main>
    );
  }
};

export default applicant;
