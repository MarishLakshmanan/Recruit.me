import { fetchWithAuth } from "app/actions/fetch";
import { useEffect, useState, useMemo } from "react";
import { CompanyProfile, FetchPayload, Job } from "schema/schema";
import CompanyHeader from "../Components/CompanyHeader";
import StatusFilter from "../Components/StatusFilter";
import SkillsFilter from "../Components/SkillsFilter";
import JobCard from "../Components/JobCard";

const Company = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("All");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get all unique skills from company jobs
  const allSkills = useMemo(() => {
    if (!profile) return [];
    const skillsSet = new Set<string>();
    profile.jobs.forEach((job) => {
      job.skills?.forEach((skill) => skillsSet.add(skill));
    });
    return Array.from(skillsSet).sort();
  }, [profile]);

  // Filter jobs based on selected filters
  const filteredJobs = useMemo(() => {
    if (!profile) return [];
    let filtered = profile.jobs;

    // Status filter
    if (selectedStatus && selectedStatus !== "All") {
      filtered = filtered.filter((job) => {
        if (selectedStatus === "Open") {
          return job.status === "open";
        } else if (selectedStatus === "Closed") {
          return job.status === "closed";
        }
        return true;
      });
    }

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((job) => {
        if (!job.skills || job.skills.length === 0) return false;
        return selectedSkills.some((skill) =>
          job.skills!.some(
            (jobSkill) => jobSkill.toLowerCase() === skill.toLowerCase()
          )
        );
      });
    }

    return filtered;
  }, [profile, selectedStatus, selectedSkills]);

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
          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
              <StatusFilter
                statuses={["All", "Open", "Closed"]}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkillsFilter
                  availableSkills={allSkills}
                  selectedSkills={selectedSkills}
                  onSkillsChange={setSelectedSkills}
                />
              </div>
            </div>

            <div className="flex-1 shadow-md rounded-lg p-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center text-gray-500">No jobs found</div>
              ) : (
                filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} editJob={editJob} />
                ))
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
};

export default Company;
