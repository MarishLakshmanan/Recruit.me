"use client";
import { Role } from "../../schema/shcema";
const Tabs = ({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: Role[];
  activeTab: Role;
  setActiveTab: (tab: Role) => void;
}) => {
  return (
    <div className="relative w-full border border-gray-300  rounded-lg p-4">
      <div className="relative flex gap-8 px-2 justify-space-around">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={` flex-1 cursor-pointer
              relative px-4 py-2 text-base font-medium transition-colors duration-300 ease-in-out
              ${
                activeTab === tab &&
                "text-white bg-primary rounded-lg backdrop-blur-md "
              }
            `}
          >
            <span className="capitalize">{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
