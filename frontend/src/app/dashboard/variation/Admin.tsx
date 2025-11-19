"use client";

import { useState } from "react";
import Tabs from "../Components/Tabs";
import CompaniesReport from "../Components/CompaniesReport";
import JobsReport from "../Components/JobsReport";
import ApplicantsReport from "../Components/ApplicantsReport";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("Companies");
  const tabs = ["Companies", "Jobs for Company", "Applicants"];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Companies":
        return <CompaniesReport />;
      case "Jobs for Company":
        return <JobsReport />;
      case "Applicants":
        return <ApplicantsReport />;
      default:
        return <CompaniesReport />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="flex-1">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Admin;