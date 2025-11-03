import React from "react";

const modal = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen drop-shadow absolute top-0 left-0 backdrop-blur-md flex items-center justify-center">
      <div className="w-[480px] rounded-2xl bg-white shadow-xl">{children}</div>
    </div>
  );
};

export default modal;
