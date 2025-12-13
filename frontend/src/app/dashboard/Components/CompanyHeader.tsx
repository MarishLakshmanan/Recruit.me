"use client";

import { CompanyProfile, Job } from "schema/schema";
import EditCompanyProfile from "./EditCompanyProfile";
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

  function changeDescription(description: string) {
    setProfile({ ...profile, description });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{profile.name}</h1>
          {profile.description && (
            <p className="mt-2 text-gray-600 whitespace-pre-wrap max-w-3xl">
              {profile.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <EditCompanyProfile
            companyName={profile.name}
            companyDescription={profile.description || ""}
            changeName={changeName}
            changeDescription={changeDescription}
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
                closeModal={() => setIsModalOpen(false)}
              />
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
