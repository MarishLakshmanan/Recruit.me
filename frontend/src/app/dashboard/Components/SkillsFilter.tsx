"use client";
import { useState, useRef, useEffect } from "react";

const SkillsFilter = ({
  availableSkills,
  selectedSkills,
  onSkillsChange,
}: {
  availableSkills: string[];
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter((s) => s !== skill));
    } else {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select skills
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-left bg-white"
      >
        {selectedSkills.length > 0
          ? `${selectedSkills.length} skill(s) selected`
          : "Select skills"}
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {availableSkills.length === 0 ? (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No skills available
            </div>
          ) : (
            availableSkills.map((skill) => (
              <label
                key={skill}
                className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill)}
                  onChange={() => handleSkillToggle(skill)}
                  className="mr-2"
                />
                <span className="text-sm">{skill}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsFilter;
