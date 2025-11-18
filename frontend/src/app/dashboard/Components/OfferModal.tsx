"use client";
import Modal from "universal/Modal";
import Button from "universal/Button";
import { acceptOffer, rejectOffer } from "app/actions/job";

const OfferModal = ({
  salary,
  jobId,
  onClose,
  onStatusChange,
}: {
  salary?: number;
  jobId: string;
  onClose: () => void;
  onStatusChange: () => void;
}) => {
  const handleAccept = async () => {
    try {
      const result = await acceptOffer(jobId);
      if (result.success) {
        alert(result.message);
        onStatusChange();
        onClose();
      } else {
        alert(result.error || "An error occurred");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(errorMessage);
    }
  };

  const handleReject = async () => {
    try {
      const result = await rejectOffer(jobId);
      if (result.success) {
        alert(result.message);
        onStatusChange();
        onClose();
      } else {
        alert(result.error || "An error occurred");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(errorMessage);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">OFFER</h2>
        <p className="mb-2">
          Congratulations! You have been offered this position
        </p>
        {salary !== undefined && salary !== null && (
          <p className="mb-6 font-semibold">
            Salary: ${salary.toLocaleString()}
          </p>
        )}
        <div className="flex gap-4">
          <Button label="Accepted" type="primary" onClick={handleAccept} />
          <Button label="Reject" type="danger" onClick={handleReject} />
        </div>
      </div>
    </Modal>
  );
};

export default OfferModal;
