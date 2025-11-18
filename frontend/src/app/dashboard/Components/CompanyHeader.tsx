"use client";

import { CompanyProfile, Job } from "schema/schema";
import EditCompanyName from "./EditCompanyName";
import { useState } from "react";
import JobForm from "./JobForm";
import Modal from "universal/Modal";
export default function CompanyHeader({
  profile,
  setProfile,
  addJob,
  editJob,
}: {
  profile: CompanyProfile;
  setProfile: (profile: CompanyProfile) => void;
  addJob: (job: Job) => void;
  editJob: (job: Job) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  function changeName(name: string) {
    setProfile({ ...profile, name });
  }

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-semibold">{profile.name}</h1>

      <div className="flex items-center gap-2">
        <EditCompanyName
          companyName={profile.name}
          changeName={(name: string) => {
            changeName(name);
          }}
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-indigo-500 px-5 py-3 text-white hover:bg-indigo-600"
        >
          Add Job
        </button>
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <JobForm
              addJob={addJob}
              editJob={editJob}
              closeModal={() => {
                setIsModalOpen(false);
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
