import { fetchWithAuth } from "app/actions/fetch";
import ApplicantHeader from "app/dashboard/Components/ApplicantHeader";
import EditApplicantSkills from "app/dashboard/Components/EditApplicantSkills";
import { useEffect, useState } from "react";
import { ApplicantProfile, FetchPayload } from "schema/shcema";

const applicant = () => {
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  useEffect(() => {
    const fetchProfile = async () => {
      const payload: FetchPayload = {
        url: `${baseUrl}/applicant/profile`,
        options: {
          method: "GET",
        },
      };
      const profile = await fetchWithAuth(payload);
      setProfile(profile as ApplicantProfile);
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return <h1>isLoading</h1>;
  }
  if (profile) {
    return (
      <main className="bg-gray-50 min-h-screen p-8">
        <div className="flex flex-row gap-4 items-center justify-between">
          <ApplicantHeader applicant={profile} />
          <EditApplicantSkills applicant={profile} />
        </div>
      </main>
    );
  }
};

export default applicant;
