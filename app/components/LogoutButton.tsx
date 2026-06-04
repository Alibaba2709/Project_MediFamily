"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      className={
        className ??
        "hidden h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-medium text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec] md:flex"
      }
      onClick={logout}
      type="button"
    >
      <LogOut size={17} aria-hidden="true" />
      Esci
    </button>
  );
}
