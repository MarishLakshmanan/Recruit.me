import { fetchWithAuth } from "app/actions/fetch";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CompanyProfile, FetchPayload, Job } from "schema/schema";
import CompanyHeader from "../Components/CompanyHeader";
import StatusFilter from "../Components/StatusFilter";
import SkillsFilter from "../Components/SkillsFilter";
import Pagination from "../Components/Pagination";
import JobCard from "../Components/JobCard";

const Company = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Initialize state from URL params
  const [selectedStatus, setSelectedStatus] = useState<string | null>(
    searchParams.get("status") || "All"
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => {
    const skillsParam = searchParams.get("skills");
    return skillsParam ? skillsParam.split(",").filter(Boolean) : [];
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [allSkills, setAllSkills] = useState<string[]>([]);
  const pageSize = 10;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const isUpdatingUrlRef = useRef(false);
  const isPageChangeRef = useRef(false);

  // Track previous filter values to detect changes and reset page
  const prevFiltersRef = useRef({
    status: selectedStatus,
    skills: selectedSkills.join(","),
  });

  // Reset page to 1 when filters change (except when page is intentionally changed)
  useEffect(() => {
    if (isPageChangeRef.current) {
      isPageChangeRef.current = false;
      return;
    }

    const filtersChanged =
      prevFiltersRef.current.status !== selectedStatus ||
      prevFiltersRef.current.skills !== selectedSkills.join(",");

    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
    }

    prevFiltersRef.current = {
      status: selectedStatus,
      skills: selectedSkills.join(","),
    };
  }, [selectedStatus, selectedSkills, currentPage]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedStatus && selectedStatus !== "All") {
      params.set("status", selectedStatus);
    }
    if (selectedSkills.length > 0) {
      params.set("skills", selectedSkills.join(","));
    }
    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    const newSearch = params.toString();
    const currentSearch = searchParams.toString();

    // Only update if URL actually changed
    if (newSearch !== currentSearch) {
      isUpdatingUrlRef.current = true;
      const newUrl = newSearch
        ? `${window.location.pathname}?${newSearch}`
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [selectedStatus, selectedSkills, currentPage, router, searchParams]);

  // Sync state from URL when URL changes (browser back/forward)
  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false;
      return;
    }

    const statusParam = searchParams.get("status");
    const skillsParam = searchParams.get("skills");
    const pageParam = searchParams.get("page");

    if (statusParam && statusParam !== selectedStatus) {
      setSelectedStatus(statusParam);
    } else if (!statusParam && selectedStatus !== "All") {
      setSelectedStatus("All");
    }

    if (skillsParam) {
      const skillsArray = skillsParam.split(",").filter(Boolean);
      if (skillsArray.join(",") !== selectedSkills.join(",")) {
        setSelectedSkills(skillsArray);
      }
    } else if (selectedSkills.length > 0) {
      setSelectedSkills([]);
    }

    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (page !== currentPage && page > 0) {
        isPageChangeRef.current = true;
        setCurrentPage(page);
      }
    } else if (currentPage !== 1) {
      isPageChangeRef.current = true;
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isLoading) {
        setIsLoading(true);
      } else {
        setJobsLoading(true);
      }

      try {
        const apiParams = new URLSearchParams();
        if (selectedStatus && selectedStatus !== "All") {
          apiParams.append("status", selectedStatus);
        }
        if (selectedSkills.length > 0) {
          // Backend supports single skill filter, use first selected skill
          apiParams.append("skills", selectedSkills[0]);
        }
        apiParams.append("offset", ((currentPage - 1) * pageSize).toString());
        apiParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/company/profile?${apiParams.toString()}`,
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
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
        setJobsLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedSkills, currentPage, pageSize, baseUrl]);

  const totalPages = profile ? Math.ceil(profile.total / pageSize) : 0;

  const handlePageChange = (page: number) => {
    isPageChangeRef.current = true;
    setCurrentPage(page);
  };

  function addJob(job: Job) {
    if (profile) {
      setProfile({
        ...profile,
        jobs: [...profile.jobs, job],
        total: profile.total + 1,
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
