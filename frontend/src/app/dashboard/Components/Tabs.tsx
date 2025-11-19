"use client";

const Tabs = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  return (
    <div className="relative w-full border border-gray-300 rounded-lg p-4">
      <div className="relative flex gap-8 px-2 justify-space-around">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 cursor-pointer
              relative px-4 py-2 text-base font-medium transition-colors duration-300 ease-in-out
              ${
                activeTab === tab &&
                "text-white bg-primary rounded-lg backdrop-blur-md "
              }
            `}
          >
            <span>{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;