import { fetchWithAuth } from "app/actions/fetch";
import ApplicantHeader from "app/dashboard/Components/ApplicantHeader";
import EditApplicantSkills from "app/dashboard/Components/EditApplicantSkills";
import StatusFilter from "app/dashboard/Components/StatusFilter";
import SearchFilter from "app/dashboard/Components/SearchFilter";
import SkillsFilter from "app/dashboard/Components/SkillsFilter";
import Pagination from "app/dashboard/Components/Pagination";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);

  // Initialize state from URL params
  const [selectedStatus, setSelectedStatus] = useState<string | null>(
    searchParams.get("status") || "All"
  );
  const initialSearch = searchParams.get("search") || "";
  const [searchFilter, setSearchFilter] = useState(initialSearch);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(() => {
    const skillsParam = searchParams.get("skills");
    return skillsParam ? skillsParam.split(",").filter(Boolean) : [];
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [debouncedSearchFilter, setDebouncedSearchFilter] =
    useState(initialSearch);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const pageSize = 10;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingUrlRef = useRef(false);
  const isPageChangeRef = useRef(false);

  // Debounce search filter
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchFilter(searchFilter);
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchFilter]);

  // Track previous filter values to detect changes and reset page
  const prevFiltersRef = useRef({
    status: selectedStatus,
    search: debouncedSearchFilter,
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
      prevFiltersRef.current.search !== debouncedSearchFilter ||
      prevFiltersRef.current.skills !== selectedSkills.join(",");

    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
    }

    prevFiltersRef.current = {
      status: selectedStatus,
      search: debouncedSearchFilter,
      skills: selectedSkills.join(","),
    };
  }, [selectedStatus, debouncedSearchFilter, selectedSkills, currentPage]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedStatus && selectedStatus !== "All") {
      params.set("status", selectedStatus);
    }
    if (debouncedSearchFilter.trim()) {
      params.set("search", debouncedSearchFilter.trim());
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
  }, [
    selectedStatus,
    debouncedSearchFilter,
    selectedSkills,
    currentPage,
    router,
    searchParams,
  ]);

  // Sync state from URL when URL changes (browser back/forward)
  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false;
      return;
    }

    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search") || "";
    const skillsParam = searchParams.get("skills");
    const pageParam = searchParams.get("page");

    if (statusParam && statusParam !== selectedStatus) {
      setSelectedStatus(statusParam);
    } else if (!statusParam && selectedStatus !== "All") {
      setSelectedStatus("All");
    }

    if (searchParam !== searchFilter) {
      setSearchFilter(searchParam);
      setDebouncedSearchFilter(searchParam);
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
        const apiParams = new URLSearchParams();
        if (debouncedSearchFilter.trim()) {
          apiParams.append("search", debouncedSearchFilter.trim());
        }
        if (selectedSkills.length > 0) {
          // Backend supports single skill filter, use first selected skill
          apiParams.append("skill", selectedSkills[0]);
        }
        if (selectedStatus && selectedStatus !== "All") {
          apiParams.append("status", selectedStatus);
        }
        apiParams.append("offset", ((currentPage - 1) * pageSize).toString());
        apiParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/applicant/job/search?${apiParams.toString()}`,
          options: {
            method: "GET",
          },
        };
        const response = (await fetchWithAuth(
          payload
        )) as SearchJobsResponse & {
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
        console.error("Failed to fetch jobs:", error);
        setJobs([]);
        setTotalJobs(0);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, [
    profile,
    debouncedSearchFilter,
    selectedSkills,
    selectedStatus,
    currentPage,
    pageSize,
    baseUrl,
  ]);

  const totalPages = Math.ceil(totalJobs / pageSize);

  const handlePageChange = (page: number) => {
    isPageChangeRef.current = true;
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
              statuses={["All", "Open", "Applied", "Offer", "Accepted"]}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchFilter value={searchFilter} onChange={setSearchFilter} />
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
