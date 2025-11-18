import { ApplicationStatus as ApplicationStatusType } from "schema/schema";

const ApplicationStatus = ({ status }: { status: ApplicationStatusType }) => {
  return (
    <div className="mb-4">
      <span className="text-sm font-medium text-gray-700">
        Application Status:{" "}
      </span>
      <span className="text-sm font-semibold text-gray-900">{status}</span>
    </div>
  );
};

export default ApplicationStatus;
