import React from "react";
import AppHeader from "./AppHeader";

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen bg-background mx-auto flex flex-col">
      <AppHeader />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
};

export default Container;
