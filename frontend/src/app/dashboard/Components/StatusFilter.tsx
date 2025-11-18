"use client";

const StatusFilter = ({
  statuses,
  selectedStatus,
  onStatusChange,
}: {
  statuses: string[];
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
}) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() =>
            onStatusChange(selectedStatus === status ? null : status)
          }
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedStatus === status
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
};

export default StatusFilter;
