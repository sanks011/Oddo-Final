"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <div id="navbar-wrapper" className="px-4 sticky top-0 z-[999] transition-transform duration-300 ease-in-out pt-4 -mt-4">
      <nav className="container relative z-[999] border-2 border-[#B6B6B6] bg-[#FCFAF5] border-dashed py-2.5 px-4 rounded-xl">
        <div className="flex justify-between items-center gap-4 w-full">
          {/* Logo & Badge Lockup */}
          <div className="flex items-center gap-3.5">
            <Link href="/" className="flex gap-3.5 items-center">
              <img src="/logo.svg" alt="SayBriefly Logo" width="202" height="48" className="h-10 w-auto" />
              <img src="/scope-change-badge.svg" alt="Scope Change Badge" width="158" height="48" className="h-9 w-auto hidden sm:block" />
            </Link>
          </div>

          {/* Center Navigation */}
          <ul className="hidden lg:flex gap-9 text-[#173300]">
            {/* Product Dropdown */}
            <li
              className="relative"
              onMouseEnter={() => setActiveDropdown("product")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a href="/" className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0 text-[#173300]">
                  <rect x="3" y="3" width="8" height="8" rx="1.5"></rect>
                  <rect x="13" y="3" width="8" height="8" rx="1.5"></rect>
                  <rect x="3" y="13" width="8" height="8" rx="1.5"></rect>
                  <rect x="13" y="13" width="8" height="8" rx="1.5"></rect>
                </svg>
                <span className="font-roboto text-base hover:font-bold transition-all">Product</span>
                <img src="/chevron-down.svg" alt="" className="mt-1" />
              </a>

              {activeDropdown === "product" && (
                <div className="absolute top-full left-0 z-[999] pt-2 w-64">
                  <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-xl overflow-hidden shadow-lg p-1">
                    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-roboto text-[#173300] hover:bg-[#173300] hover:text-[#FCFAF5] transition-colors rounded-lg">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "#A8E5E5" }}>
                        📦
                      </span>
                      Project Management
                    </Link>
                    <a href="#scope" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-roboto text-[#173300] hover:bg-[#173300] hover:text-[#FCFAF5] transition-colors rounded-lg">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "#A5B3F1" }}>
                        📝
                      </span>
                      Notes and Briefs
                    </a>
                    <a href="#agent" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-roboto text-[#173300] hover:bg-[#173300] hover:text-[#FCFAF5] transition-colors rounded-lg">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "#F6D0FF" }}>
                        📅
                      </span>
                      Calendar
                    </a>
                  </div>
                </div>
              )}
            </li>

            {/* Features Dropdown */}
            <li
              className="relative"
              onMouseEnter={() => setActiveDropdown("features")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a href="#scope" className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0 text-[#173300]">
                  <path d="M2 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3h-3V7H5v7h5v3H5a3 3 0 0 1-3-3V7z"></path>
                  <path d="M17 9a6 6 0 1 0 3.48 10.9l2.6 2.6 1.42-1.42-2.6-2.6A6 6 0 0 0 17 9zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"></path>
                </svg>
                <span className="font-roboto text-base hover:font-bold transition-all">Features</span>
                <img src="/chevron-down.svg" alt="" className="mt-1" />
              </a>

              {activeDropdown === "features" && (
                <div className="absolute top-full left-0 z-[999] pt-2 w-64">
                  <div className="bg-[#FCFAF5] border-2 border-dashed border-[#B6B6B6] rounded-xl overflow-hidden shadow-lg p-1">
                    <a href="#scope" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-roboto text-[#173300] hover:bg-[#173300] hover:text-[#FCFAF5] transition-colors rounded-lg">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "#FDE68A" }}>
                        👁️
                      </span>
                      Scope Creep Detection
                    </a>
                    <a href="#agent" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-roboto text-[#173300] hover:bg-[#173300] hover:text-[#FCFAF5] transition-colors rounded-lg">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "#A5B3F1" }}>
                        🤖
                      </span>
                      The Agent
                    </a>
                  </div>
                </div>
              )}
            </li>

            <li className="relative">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="font-roboto text-base hover:font-bold transition-all text-[#173300]">
                  Inventory Hub
                </span>
                <span className="bg-[#C9F0C1] text-[#173300] border border-[#173300] text-[10px] font-roboto font-bold px-1.5 py-0.5 rounded-full">
                  LIVE APP
                </span>
              </Link>
            </li>
          </ul>

          {/* Right Action Button Stack */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 py-2.5 px-6 border border-[#173300] rounded-md text-base bg-[#173300] hover:opacity-90 text-[#FFEB5B] transition-all font-semibold shadow-[3px_3px_0px_#173300]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-[#FFEB5B] shrink-0">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"></path>
              </svg>
              <span>{isDashboard ? "View Landing" : "Launch App Hub"}</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
