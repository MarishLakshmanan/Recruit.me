import { fetchWithAuth } from "app/actions/fetch";
import ApplicantHeader from "app/dashboard/Components/ApplicantHeader";
import EditApplicantSkills from "app/dashboard/Components/EditApplicantSkills";
import StatusFilter from "app/dashboard/Components/StatusFilter";
import SearchFilter from "app/dashboard/Components/SearchFilter";
import SkillsFilter from "app/dashboard/Components/SkillsFilter";
import Pagination from "app/dashboard/Components/Pagination";
import { useEffect, useState } from "react";
import {
  ApplicantProfile,
  FetchPayload,
  Job,
  SearchJobsResponse,
} from "schema/schema";
import JobCard from "../Components/JobCard";

type JobWithStatus = Job & {
  application_status: string;
  company_name: string;
};

const Applicant = () => {
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const pageSize = 10;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      const payload: FetchPayload = {
        url: `${baseUrl}/applicant/profile`,
        options: {
          method: "GET",
        },
      };
      const profileData = (await fetchWithAuth(payload)) as ApplicantProfile;
      setProfile(profileData);
      setIsLoading(false);
    };
    fetchProfile();
  }, [baseUrl]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!profile) return;

      setJobsLoading(true);
      try {
        const searchParams = new URLSearchParams();
        if (searchFilter.trim()) {
          searchParams.append("search", searchFilter.trim());
        }
        if (selectedSkills.length > 0) {
          searchParams.append("skill", selectedSkills[0]);
        }
        if (selectedStatus && selectedStatus !== "All") {
          searchParams.append("status", selectedStatus);
        }
        searchParams.append("offset", ((currentPage - 1) * pageSize).toString());
        searchParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/applicant/job/search?${searchParams.toString()}`,
          options: {
            method: "GET",
          },
        };
        const response = (await fetchWithAuth(payload)) as SearchJobsResponse & {
          jobs: JobWithStatus[];
        };

        setJobs(response.jobs || []);
        setTotalJobs(response.total || 0);

        const skillsSet = new Set<string>();
        response.jobs.forEach((job) => {
          job.skills?.forEach((skill) => skillsSet.add(skill));
        });
        setAllSkills(Array.from(skillsSet).sort());
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        setJobs([]);
        setTotalJobs(0);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [profile, searchFilter, selectedSkills, selectedStatus, currentPage, pageSize, baseUrl]);

  const totalPages = Math.ceil(totalJobs / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  function editJob(job: Job) {
    const jobIndex = jobs.findIndex((j) => j.id === job.id);
    if (jobIndex !== -1) {
      setJobs(jobs.map((j) => (j.id === job.id ? { ...j, ...job } : j)));
    }
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

        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
            <StatusFilter
              statuses={["All", "Open", "Applied", "Offered", "Accepted"]}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchFilter
                value={searchFilter}
                onChange={setSearchFilter}
              />
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
            ) : jobs.length === 0 ? (
              <div className="text-center text-gray-500">No jobs found</div>
            ) : (
              <>
                {jobs.map((job) => (
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
      </main>
    );
  }
};

export default Applicant;
