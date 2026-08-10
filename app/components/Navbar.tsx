"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; name?: string; plan?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("xts_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("xts_user");
    document.cookie = "xts_user=; path=/; max-age=0; SameSite=Lax";
    window.location.href = "/auth";
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Saved Leads", href: "/saved" },
    { label: "Archive", href: "/archive" },
    { label: "Outreach", href: "/outreach" },
  ];

  return (
    <nav className="border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-50 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="font-black text-xl tracking-tight text-black flex items-center gap-2 hover:opacity-90">
          <span>⚡ XTREME SCRAPER</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-bold transition-all ${
                  isActive
                    ? "text-black border-b-2 border-yellow-400 pb-0.5"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm font-bold text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3.5 py-1.5 rounded-xl transition-all bg-white"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="text-sm font-bold px-4 py-2 rounded-xl text-black transition-all hover:brightness-95 shadow-sm"
            style={{ backgroundColor: "#FFBE00" }}
          >
            Sign In →
          </Link>
        )}
      </div>
    </nav>
  );
}
