"use client";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const getVisiblePages = () => {
    const visiblePages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      visiblePages.push(1);

      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          visiblePages.push(i);
        }
        visiblePages.push("...");
        visiblePages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        visiblePages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        visiblePages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push("...");
        visiblePages.push(totalPages);
      }
    }

    return visiblePages;
  };

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
      >
        Previous
      </button>

      {visiblePages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-gray-500 text-sm font-medium"
            >
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === pageNumber
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
      >
        Next
      </button>

      <span className="text-sm text-gray-600 ml-4">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
};

export default Pagination;
