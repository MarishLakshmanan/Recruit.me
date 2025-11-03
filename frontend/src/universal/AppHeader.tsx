import { logout } from "app/actions/fetch";
import { LogOutIcon } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

const AppHeader = () => {
  async function handleLogout() {
    const response = await logout();
    if (response.success) {
      redirect("/login");
    }
  }
  return (
    <div className="w-screen h-16  flex items-center justify-between py-4 px-8 bg-white border-b border-gray-200">
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
