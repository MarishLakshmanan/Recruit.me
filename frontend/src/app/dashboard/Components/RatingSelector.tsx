"use client";

const RatingSelector = ({
  currentRating,
  onRatingChange,
  isLoading,
  disabled = false,
}: {
  currentRating: "hirable" | "wait" | "unacceptable" | "unrated";
  onRatingChange: (
    rating: "hirable" | "wait" | "unacceptable" | "unrated"
  ) => void;
  isLoading: boolean;
  disabled?: boolean;
}) => {
  const ratingOptions: Array<{
    value: "hirable" | "wait" | "unacceptable" | "unrated";
    label: string;
    color: string;
    bgColor: string;
  }> = [
    {
      value: "hirable",
      label: "Hirable",
      color: "text-green-700",
      bgColor: "bg-green-100 border-green-300",
    },
    {
      value: "wait",
      label: "Wait",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100 border-yellow-300",
    },
    {
      value: "unacceptable",
      label: "Unacceptable",
      color: "text-red-700",
      bgColor: "bg-red-100 border-red-300",
    },
    {
      value: "unrated",
      label: "Unrated",
      color: "text-gray-700",
      bgColor: "bg-gray-100 border-gray-300",
    },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {ratingOptions.map((option) => {
        const isSelected = currentRating === option.value;
        return (
          <button
            key={option.value}
            onClick={() =>
              !isLoading && !disabled && onRatingChange(option.value)
            }
            disabled={isLoading || disabled}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
              isSelected
                ? `${option.bgColor} ${option.color} border-2 font-semibold`
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            } ${
              isLoading || disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default RatingSelector;
