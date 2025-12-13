"use client";

import { fetchWithAuth } from "app/actions/fetch";
import ApplicantHeader from "app/dashboard/Components/ApplicantHeader";
import EditApplicantProfile from "app/dashboard/Components/EditApplicantProfile";
import ApplicationCard from "app/dashboard/Components/ApplicationCard";
import StatusFilter from "app/dashboard/Components/StatusFilter";
import Pagination from "app/dashboard/Components/Pagination";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "app/context/AuthContext";
import { ApplicantProfile, FetchPayload, Role } from "schema/schema";

const Applicant = ({ role }: { role: Role | null }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const pageSize = 10;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const prevStatusRef = useRef(selectedStatus);

  useEffect(() => {
    if (prevStatusRef.current !== selectedStatus && currentPage !== 1) {
      setCurrentPage(1);
    }
    prevStatusRef.current = selectedStatus;
  }, [selectedStatus, currentPage]);

  useEffect(() => {
    // Wait for auth to be confirmed before making requests
    if (authLoading || !isAuthenticated) {
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const apiParams = new URLSearchParams();
        apiParams.append("offset", ((currentPage - 1) * pageSize).toString());
        apiParams.append("limit", pageSize.toString());

        if (selectedStatus && selectedStatus !== "All") {
          apiParams.append("status", selectedStatus);
        }

        const payload: FetchPayload = {
          url: `${baseUrl}/applicant/profile?${apiParams.toString()}`,
          options: {
            method: "GET",
          },
        };
        const profileData = (await fetchWithAuth(payload)) as ApplicantProfile;
        setProfile(profileData);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [currentPage, selectedStatus, baseUrl, isAuthenticated, authLoading]);

  const totalPages = profile ? Math.ceil(profile.total / pageSize) : 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status || "All");
  };

  const handleProfileUpdate = (updates: { name?: string; skills?: string[] }) => {
    if (profile) {
      setProfile({
        ...profile,
        ...(updates.name && { name: updates.name }),
        ...(updates.skills && { skills: updates.skills }),
      });
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl">Loading...</h1>
      </div>
    );
  }

  if (profile) {
    return (
      <main className="flex flex-col h-full">
        <div className="flex flex-row gap-4 items-center justify-between mb-6">
          <ApplicantHeader applicant={profile} />
          <div className="flex gap-3">
            <EditApplicantProfile
              applicant={profile}
              onProfileUpdate={handleProfileUpdate}
            />
            <button
              onClick={() => router.push("/dashboard/search")}
              className="rounded-xl bg-indigo-500 px-5 py-3 text-white hover:bg-indigo-600"
            >
              Search for Jobs
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">My Skills</h2>
          {profile.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-4 py-2 rounded-full border border-blue-300 bg-blue-50 text-sm text-blue-800 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No skills added yet. Click &ldquo;Edit Profile&rdquo; to add your skills.
            </p>
          )}
        </div>

        <div className="mb-4">
          <StatusFilter
            statuses={["All", "Pending", "Offered", "Accepted", "Rejected"]}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
          />
        </div>

        <div className="flex-1 relative">
          <h2 className="text-2xl font-bold mb-4">My Applications</h2>
          <div className={`${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
            {profile.applications && profile.applications.length > 0 ? (
              <>
                {profile.applications.map((app) => (
                  <ApplicationCard key={app.job_id} application={app} />
                ))}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {selectedStatus === "All"
                  ? "No applications yet. Click 'Search for Jobs' to start applying!"
                  : `No applications with status: ${selectedStatus}`}
              </div>
            )}
          </div>
          {isLoading && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
              <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return null;
};

export default Applicant;
