"use client";
import { useAuthContext } from "app/context/AuthContext";
import { Role } from "schema/schema";
import Applicant from "./variation/Applicant";
import Company from "./variation/Company";
import Admin from "./variation/Admin";
import Container from "universal/Container";

const Dashboard = () => {
  const { role: userRole, isLoading } = useAuthContext();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (userRole === Role.COMPANY) {
    return (
      <Container>
        <Company role={userRole} />
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
      <Applicant role={userRole} />
    </Container>
  );
};

export default Dashboard;
