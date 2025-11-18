"use client";
import { ApplicationStatus } from "schema/schema";
import Button from "universal/Button";
import {
  applyToJob,
  withdrawApplication,
  rescindAcceptance,
} from "app/actions/job";
import { useState } from "react";
import OfferModal from "./OfferModal";

const JobActions = ({
  status,
  jobId,
  salary,
  onStatusChange,
}: {
  status: ApplicationStatus;
  jobId: string;
  salary?: number;
  onStatusChange: () => void;
}) => {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const handleAction = async (
    action: () => Promise<{
      success: boolean;
      error?: string;
      message?: string;
    }>
  ) => {
    try {
      const result = await action();
      if (result.success) {
        alert(result.message);
        onStatusChange();
      } else {
        alert(result.error || "An error occurred");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(errorMessage);
    }
  };

  if (status === "Not Applied") {
    return (
      <div className="flex gap-2 mt-4">
        <Button
          label="Apply"
          type="primary"
          onClick={() => handleAction(() => applyToJob(jobId))}
        />
      </div>
    );
  }

  if (status === "Applied") {
    return (
      <div className="flex gap-2 mt-4">
        <Button
          label="Withdraw"
          type="secondary"
          onClick={() => handleAction(() => withdrawApplication(jobId))}
        />
      </div>
    );
  }

  if (status === "Offer") {
    return (
      <>
        <div className="flex gap-2 mt-4">
          <Button
            label="Open Offer"
            type="primary"
            onClick={() => setIsOfferModalOpen(true)}
          />
        </div>
        {isOfferModalOpen && (
          <OfferModal
            salary={salary}
            jobId={jobId}
            onClose={() => setIsOfferModalOpen(false)}
            onStatusChange={onStatusChange}
          />
        )}
      </>
    );
  }

  if (status === "Accepted") {
    return (
      <div className="flex gap-2 mt-4">
        <Button
          label="Rescind Offer"
          type="danger"
          onClick={() => handleAction(() => rescindAcceptance(jobId))}
        />
      </div>
    );
  }

  return null;
};

export default JobActions;
