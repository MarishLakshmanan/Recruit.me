import { fetchWithAuth } from "app/actions/fetch";
import React, { useEffect, useState } from "react";
import { CompanyProfile, FetchPayload } from "schema/shcema";
import CompanyHeader from "../Components/CompanyHeader";
import EditCompanyName from "../Components/EditCompanyName";

const dashboard = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
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
      setName(profile.name);
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return <h1>isLoading</h1>;
  }
  if (profile && name) {
    return (
      <div>
        <CompanyHeader name={name} />
        <EditCompanyName
          companyName={name}
          changeName={(name: string) => {
            setName(name);
          }}
        />
      </div>
    );
  }
};

export default dashboard;
