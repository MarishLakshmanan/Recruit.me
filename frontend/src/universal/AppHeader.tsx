import { LogOutIcon } from "lucide-react";
import Link from "next/link";

const AppHeader = () => {
  function handleLogout() {
    console.log("logout");
  }
  return (
    <div className="w-screen h-16  flex items-center justify-between py-4 px-8 bg-white">
      <h1 className="text-2xl font-bold">
        <Link href="/">Recruit.me</Link>
      </h1>
      <div className="cursor-pointer " onClick={handleLogout}>
        <LogOutIcon />
      </div>
    </div>
  );
};

export default AppHeader;
