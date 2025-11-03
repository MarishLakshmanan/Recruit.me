"use client";
import { fetchWithAuth } from "app/actions/fetch";
import React, { useEffect } from "react";
import { FetchPayload } from "schema/shcema";

const page = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      const payload: FetchPayload = {
        url: `${baseUrl}/company/profile`,
        options: {
          method: "GET",
        },
      };
      try {
        const response = await fetchWithAuth(payload);
        console.log(response);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUser();
  }, []);
  return <div>page</div>;
};

export default page;
