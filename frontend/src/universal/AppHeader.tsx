"use client";

import { logout } from "app/actions/fetch";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AppHeader = () => {
  const router = useRouter();

  async function handleLogout() {
    try {
      const response = await logout();
      if (response.success) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  }

  return (
    <div className="w-screen h-16  flex items-center justify-between py-4 px-8 bg-white border-b border-gray-200">
      <h1 className="text-2xl font-bold">
        <Link href="/">Recruit.me</Link>
      </h1>
      <button
        className="cursor-pointer"
        onClick={handleLogout}
        aria-label="Logout"
      >
        <LogOutIcon />
      </button>
    </div>
  );
};

export default AppHeader;
