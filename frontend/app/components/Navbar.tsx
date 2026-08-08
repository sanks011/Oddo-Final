"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Simulating auth state — replace with real auth context later
const useAuth = () => {
  return { user: null as null | { name: string } };
};

export default function Navbar() {
  const { user } = useAuth();

  return (
    <div
      id="navbar-wrapper"
      className="px-4 sticky top-0 z-[999] transition-transform duration-300 ease-in-out pt-6"
    >
      <nav className="container relative z-[999] border-2 border-[#B6B6B6] bg-[#FCFAF5] border-dashed py-2.5 px-4 rounded-xl max-w-[860px] mx-auto">
        <div className="flex justify-between items-center gap-4 w-full">

          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              {/* Logo Mark — Yellow square with monogram */}
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 select-none"
                style={{ background: "#FFEB5B" }}
                aria-label="Neko-ber logo"
              >
                <span
                  className="text-[#173300] font-extrabold leading-none"
                  style={{
                    fontFamily: "var(--font-bricolage-grotesque)",
                    fontSize: "15px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Nc
                </span>
              </div>

              {/* Brand Wordmark */}
              <span
                className="text-[#173300] font-bold text-xl select-none tracking-tight"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Neko-ber
              </span>
            </Link>
          </div>

          {/* Right Action Button Stack */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 py-2 px-5 border border-[#173300] rounded-md text-sm bg-[#173300] hover:opacity-90 text-[#FFEB5B] transition-all font-semibold shadow-[3px_3px_0px_#173300]"
                id="nav-dashboard-btn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-[#FFEB5B] shrink-0"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 py-2 px-4 border border-[#173300] rounded-md text-sm bg-transparent hover:bg-[#173300] hover:text-[#FCFAF5] text-[#173300] transition-all font-medium"
                  id="nav-login-btn"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 py-2 px-5 border border-[#173300] rounded-md text-sm bg-[#173300] hover:opacity-90 text-[#FFEB5B] transition-all font-semibold shadow-[3px_3px_0px_#173300]"
                  id="nav-signup-btn"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

        </div>
      </nav>
    </div>
  );
}
