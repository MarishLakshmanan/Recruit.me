"use client";
import { getUserRole } from "app/actions/fetch";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "schema/schema";
import Applicant from "./variation/Applicant";
import Company from "./variation/Company";
import Admin from "./variation/Admin";
import Container from "universal/Container";

const Dashboard = () => {
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
        console.error("Auth error:", error);
        router.push("/login");
      }
    };
    fetchUserRole();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (userRole === Role.COMPANY) {
    return (
      <Container>
        <Company />
      </Container>
    );
  }
  if (userRole === Role.ADMIN) {
    return (
      <Container>
        <Admin />
      </Container>
    );
  }
  return (
    <Container>
      <Applicant />
    </Container>
  );
};

export default Dashboard;
