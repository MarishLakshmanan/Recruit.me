import { fetchWithAuth } from "app/actions/fetch";
import ApplicantHeader from "app/dashboard/Components/ApplicantHeader";
import EditApplicantSkills from "app/dashboard/Components/EditApplicantSkills";
import StatusFilter from "app/dashboard/Components/StatusFilter";
import CompanyNameFilter from "app/dashboard/Components/CompanyNameFilter";
import SkillsFilter from "app/dashboard/Components/SkillsFilter";
import { useEffect, useState, useMemo } from "react";
import {
  ApplicantProfile,
  Application,
  FetchPayload,
  Job,
  SearchJobsResponse,
} from "schema/schema";
import JobCard from "../Components/JobCard";

const Applicant = () => {
  const [profile, setProfile] = useState<(ApplicantProfile & { applications?: Application[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("All");
  const [companyNameFilter, setCompanyNameFilter] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchProfile = async () => {
    let payload: FetchPayload = {
      url: `${baseUrl}/applicant/profile`,
      options: {
        method: "GET",
      },
    };
    const profileData = (await fetchWithAuth(payload)) as ApplicantProfile & {
      applications: Application[];
    };
    setProfile({
      ...profileData,
      applications: profileData.applications || [],
    });
    setApplications(profileData.applications || []);

    // Build search URL with filters
    const searchParams = new URLSearchParams();
    if (companyNameFilter) {
      searchParams.append("company", companyNameFilter);
    }
    if (selectedSkills.length > 0) {
      // For now, use first skill - backend supports single skill filter
      searchParams.append("skill", selectedSkills[0]);
    }

    payload = {
      url: `${baseUrl}/jobs/search?${searchParams.toString()}`,
      options: {
        method: "GET",
      },
    };
    const jobsResponse = (await fetchWithAuth(payload)) as SearchJobsResponse;
    setOpenJobs(jobsResponse.jobs as Job[]);
  };

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      await fetchProfile();
      setIsLoading(false);
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyNameFilter, selectedSkills]);

  // Combine and filter jobs
  const filteredJobs = useMemo(() => {
    const allJobs: (Job & {
      applicationStatus?: string;
      company_name?: string;
    })[] = [];

    // Add open jobs (not applied)
    const appliedJobIds = new Set(applications.map((app) => app.job_id));
    const openJobsNotApplied = openJobs
      .filter((job) => !appliedJobIds.has(job.id))
      .map((job) => ({
        ...job,
        applicationStatus: "Open",
      }));
    allJobs.push(...openJobsNotApplied);

    // Add jobs from applications
    const applicationJobs = applications.map((app) => ({
      id: app.job_id,
      title: app.job_title,
      post_date: app.post_date,
      status: "open",
      applicant_count: typeof app.applicant_count === 'string' ? parseInt(app.applicant_count, 10) : app.applicant_count,
      hired_count: 0,
      skills: app.skills || [],
      applicationStatus: mapApplicationStatus(app.status),
      company_name: app.company_name,
    }));
    allJobs.push(...applicationJobs);

    // Apply filters
    let filtered = allJobs;

    // Status filter
    if (selectedStatus && selectedStatus !== "All") {
      if (selectedStatus === "Open") {
        filtered = filtered.filter((job) => job.applicationStatus === "Open");
      } else {
        filtered = filtered.filter(
          (job) => job.applicationStatus === selectedStatus
        );
      }
    }

    // Company name filter (client-side for applications)
    if (companyNameFilter) {
      filtered = filtered.filter((job) => {
        const companyName = job.company_name || "";
        return companyName
          .toLowerCase()
          .includes(companyNameFilter.toLowerCase());
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
  }, [
    openJobs,
    applications,
    selectedStatus,
    companyNameFilter,
    selectedSkills,
  ]);

  // Get all unique skills from all jobs
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    openJobs.forEach((job) => {
      job.skills?.forEach((skill) => skillsSet.add(skill));
    });
    applications.forEach((app) => {
      app.skills?.forEach((skill) => skillsSet.add(skill));
    });
    return Array.from(skillsSet).sort();
  }, [openJobs, applications]);

  function mapApplicationStatus(status: string): string {
    switch (status) {
      case "pending":
        return "Applied";
      case "offered":
        return "Offer";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return "Applied";
    }
  }

  function editJob(job: Job) {
    // Update in openJobs if it exists there
    const openJobIndex = openJobs.findIndex((j) => j.id === job.id);
    if (openJobIndex !== -1) {
      setOpenJobs(openJobs.map((j) => (j.id === job.id ? job : j)));
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
          <EditApplicantSkills applicant={profile} onUpdate={fetchProfile} />
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
            <StatusFilter
              statuses={["All", "Open", "Applied", "Offered", "Accepted"]}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CompanyNameFilter
                value={companyNameFilter}
                onChange={setCompanyNameFilter}
              />
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
      </main>
    );
  }
};

export default Applicant;
