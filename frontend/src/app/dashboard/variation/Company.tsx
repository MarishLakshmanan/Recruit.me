import { fetchWithAuth } from "app/actions/fetch";
import { useEffect, useState } from "react";
import { CompanyProfile, FetchPayload, Job } from "schema/schema";
import CompanyHeader from "../Components/CompanyHeader";
import { fakeJobs } from "schema/schema";
import JobCard from "../Components/JobCard";

const dashboard = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  useEffect(() => {
    const fetchProfile = async () => {
      const payload: FetchPayload = {
        url: `${baseUrl}/company/profile`,
        options: {
          method: "GET",
        },
      };
      const profile = await fetchWithAuth(payload);
      setProfile(profile as CompanyProfile);

      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  function addJob(job: Job) {
    if (profile) {
      setProfile({ ...profile, jobs: [...profile.jobs, job] });
    }
  }
  function editJob(job: Job) {
    if (profile) {
      setProfile({
        ...profile,
        jobs: profile.jobs.map((j) => (j.id === job.id ? job : j)),
      });
    }
  }

  if (isLoading) {
    return <h1>isLoading</h1>;
  }
  if (profile) {
    return (
      <>
        <div className="flex flex-col h-full">
          <CompanyHeader
            profile={profile}
            setProfile={setProfile}
            addJob={addJob}
            editJob={editJob}
          />
          <div className="mt-8 space-y-4 flex-1 shadow-md rounded-lg p-4 ">
            {profile.jobs.length === 0 ? (
              <div className="text-center text-gray-500">No jobs found</div>
            ) : (
              profile.jobs.map((job) => (
                <JobCard key={job.id} job={job} editJob={editJob} />
              ))
            )}
          </div>
        </div>
      </>
    );
  }
};

export default dashboard;
