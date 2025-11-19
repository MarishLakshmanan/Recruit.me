import { fetchWithAuth } from "app/actions/fetch";
import { useEffect, useState } from "react";
import { CompanyProfile, FetchPayload, Job } from "schema/schema";
import CompanyHeader from "../Components/CompanyHeader";
import StatusFilter from "../Components/StatusFilter";
import SkillsFilter from "../Components/SkillsFilter";
import Pagination from "../Components/Pagination";
import JobCard from "../Components/JobCard";

const Company = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("All");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const pageSize = 10;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      if (isLoading) {
        setIsLoading(true);
      } else {
        setJobsLoading(true);
      }

      try {
        const searchParams = new URLSearchParams();
        if (selectedStatus && selectedStatus !== "All") {
          searchParams.append("status", selectedStatus);
        }
        if (selectedSkills.length > 0) {
          searchParams.append("skills", selectedSkills[0]);
        }
        searchParams.append("offset", ((currentPage - 1) * pageSize).toString());
        searchParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/company/profile?${searchParams.toString()}`,
          options: {
            method: "GET",
          },
        };
        const profileData = await fetchWithAuth(payload);
        setProfile(profileData as CompanyProfile);

        const skillsSet = new Set<string>();
        (profileData as CompanyProfile).jobs.forEach((job) => {
          job.skills?.forEach((skill) => skillsSet.add(skill));
        });
        setAllSkills(Array.from(skillsSet).sort());
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
        setJobsLoading(false);
      }
    };

    fetchProfile();
  }, [selectedStatus, selectedSkills, currentPage, pageSize, baseUrl]);

  const totalPages = profile ? Math.ceil(profile.total / pageSize) : 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  function addJob(job: Job) {
    if (profile) {
      setProfile({
        ...profile,
        jobs: [...profile.jobs, job],
        total: profile.total + 1
      });
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
                statuses={["All", "Open", "Closed", "Draft"]}
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
              {jobsLoading ? (
                <div className="text-center text-gray-500">Loading jobs...</div>
              ) : !profile || profile.jobs.length === 0 ? (
                <div className="text-center text-gray-500">No jobs found</div>
              ) : (
                <>
                  {profile.jobs.map((job) => (
                    <JobCard key={job.id} job={job} editJob={editJob} />
                  ))}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
};

export default Company;
