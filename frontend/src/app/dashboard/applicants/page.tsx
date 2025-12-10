"use client";

import { fetchWithAuth } from "app/actions/fetch";
import SearchFilter from "app/dashboard/Components/SearchFilter";
import SkillsFilter from "app/dashboard/Components/SkillsFilter";
import Pagination from "app/dashboard/Components/Pagination";
import ApplicantCard from "app/dashboard/Components/ApplicantCard";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FetchPayload,
  SearchApplicantsResponse,
  ApplicantReport,
} from "schema/schema";

function ApplicantsSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applicants, setApplicants] = useState<ApplicantReport[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);

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
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const pageSize = 10;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingUrlRef = useRef(false);
  const isPageChangeRef = useRef(false);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchFilter(searchFilter);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchFilter]);

  const prevFiltersRef = useRef({
    search: debouncedSearchFilter,
    skills: selectedSkills.join(","),
  });

  useEffect(() => {
    if (isPageChangeRef.current) {
      isPageChangeRef.current = false;
      return;
    }

    const filtersChanged =
      prevFiltersRef.current.search !== debouncedSearchFilter ||
      prevFiltersRef.current.skills !== selectedSkills.join(",");

    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
    }

    prevFiltersRef.current = {
      search: debouncedSearchFilter,
      skills: selectedSkills.join(","),
    };
  }, [debouncedSearchFilter, selectedSkills, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams();

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

    if (newSearch !== currentSearch) {
      isUpdatingUrlRef.current = true;
      const newUrl = newSearch
        ? `/dashboard/applicants?${newSearch}`
        : "/dashboard/applicants";
      router.replace(newUrl, { scroll: false });
    }
  }, [
    debouncedSearchFilter,
    selectedSkills,
    currentPage,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false;
      return;
    }

    const searchParam = searchParams.get("search") || "";
    const skillsParam = searchParams.get("skills");
    const pageParam = searchParams.get("page");

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
  }, [searchParams]);

  useEffect(() => {
    const fetchApplicants = async () => {
      setApplicantsLoading(true);
      try {
        const apiParams = new URLSearchParams();
        if (debouncedSearchFilter.trim()) {
          apiParams.append("search", debouncedSearchFilter.trim());
        }
        if (selectedSkills.length > 0) {
          apiParams.append("skills", selectedSkills.join(","));
        }
        apiParams.append("offset", ((currentPage - 1) * pageSize).toString());
        apiParams.append("limit", pageSize.toString());

        const payload: FetchPayload = {
          url: `${baseUrl}/company/applicants/search?${apiParams.toString()}`,
          options: {
            method: "GET",
          },
        };
        const response = (await fetchWithAuth(
          payload
        )) as SearchApplicantsResponse;

        setApplicants(response.applicants || []);
        setTotalApplicants(response.total || 0);

        const skillsSet = new Set<string>();
        response.applicants.forEach((applicant) => {
          applicant.skills?.forEach((skill) => skillsSet.add(skill));
        });
        setAllSkills(Array.from(skillsSet).sort());
      } catch (error) {
        console.error("Failed to fetch applicants:", error);
        setApplicants([]);
        setTotalApplicants(0);
      } finally {
        setApplicantsLoading(false);
      }
    };

    fetchApplicants();
  }, [debouncedSearchFilter, selectedSkills, currentPage, pageSize, baseUrl]);

  const totalPages = Math.ceil(totalApplicants / pageSize);

  const handlePageChange = (page: number) => {
    isPageChangeRef.current = true;
    setCurrentPage(page);
  };

  return (
    <main className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Browse Applicants</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-xl bg-gray-500 px-5 py-3 text-white hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchFilter
              value={searchFilter}
              onChange={setSearchFilter}
              label="Search applicants"
              placeholder="Search by name or email..."
            />
            <SkillsFilter
              availableSkills={allSkills}
              selectedSkills={selectedSkills}
              onSkillsChange={setSelectedSkills}
            />
          </div>
        </div>

        <div className="flex-1 shadow-md rounded-lg p-4">
          {applicantsLoading ? (
            <div className="text-center text-gray-500">
              Loading applicants...
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center text-gray-500">No applicants found</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applicants.map((applicant) => (
                  <ApplicantCard key={applicant.id} applicant={applicant} />
                ))}
              </div>
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

export default function ApplicantsSearch() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <h1 className="text-2xl">Loading...</h1>
        </div>
      }
    >
      <ApplicantsSearchContent />
    </Suspense>
  );
}
