import React from "react";

const Fields = ({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;

  setValue: (value: string) => void;
}) => {
  return (
    <div>
      <label className="block text-md font-medium text-foreground mb-2 capitalize">
        {label}
      </label>
      <input
        type="text"
        onChange={(e) => setValue(e.target.value)}
        value={value}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  );
};

export default Fields;
