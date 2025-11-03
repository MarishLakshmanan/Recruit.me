"use client";
import { getUserRole } from "app/actions/fetch";
import { useEffect, useState } from "react";
import { Role } from "schema/shcema";
import Applicant from "./dashboard/variation/Applicant";
import Company from "./dashboard/variation/Company";
import Container from "universal/Container";
import { useRouter } from "next/navigation";

const page = () => {
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getUserRole();
        setUserRole(role);
        setLoading(false);
      } catch (error) {
        alert(error as string);
        router.push("/login");
      }
    };
    fetchUserRole();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (userRole === Role.COMPANY) {
    return (
      <Container>
        <Company />;
      </Container>
    );
  }
  return (
    <Container>
      <Applicant />;
    </Container>
  );
};

export default page;
