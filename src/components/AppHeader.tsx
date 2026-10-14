"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, FilePlus2 } from "lucide-react";
import { clearSession, getSessionUser } from "@/lib/session";
import { BRAND } from "@/lib/defaults";
import { useEffect, useState } from "react";

export default function AppHeader() {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    const u = getSessionUser();
    setName(u?.full_name || u?.username || "");
  }, []);

  function logout() {
    clearSession();
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/");
  }

  return (
    <header className="w-full bg-[#204978] text-white shadow-md font-cairo border-b border-[#18365a]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wasl-logo.jpg"
            alt={BRAND.name}
            className="h-9 w-9 rounded-lg object-cover border border-white/20"
          />
          <div>
            <p className="text-sm font-bold leading-tight">{BRAND.nameAr}</p>
            <p className="text-[11px] text-white/70">{BRAND.name}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/order/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20 sm:text-sm"
          >
            <FilePlus2 className="h-4 w-4" />
            <span className="hidden sm:inline">Create New Invoice</span>
            <span className="sm:hidden">New</span>
          </Link>
          <span className="hidden text-xs text-white/80 sm:inline">{name}</span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
