"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  { ssr: false }
);

// Simulating auth state — replace with real auth context later
const useAuth = () => {
  return { user: null as null | { name: string } };
};

export default function LandingHero() {
  const { user } = useAuth();

  return (
    <div className="relative pt-6 overflow-x-hidden">
      {/* Background Radial Glow */}
      <div className="bg-[radial-gradient(ellipse_at_50%_0%,#ffec5b25_0%,transparent_70%)] h-80 md:h-120 lg:h-150 w-full absolute top-0 left-0 z-1 pointer-events-none"></div>

      {/* Main Text Content Overlay */}
      <div className="relative z-10">
        <div className="container flex flex-col items-center gap-4 lg:gap-5 py-8 lg:py-10 px-4 max-w-[1280px] mx-auto text-center">

          {/* Tagline Badge — SVG matching how-it-work-title style */}
          <img
            src="/smart-carpooling-title.svg"
            alt="Smart Carpooling, Re-Imagined"
            className="h-11 w-auto"
          />

          {/* Hero Display Heading */}
          <h1 className="font-heading text-3xl md:text-5xl lg:text-[64px] xl:text-[80px] font-extrabold text-center mt-2 lg:mt-4 text-[#173300] leading-[1.05]">
            Book a ride.{" "}
            <br className="hidden md:block" />
            Offer a seat.{" "}
            <span className="highlight-wash">Negotiate the fare.</span>
          </h1>

          {/* Hero Subhead */}
          <p className="text-black text-base md:text-[20px] text-center w-full max-w-3xl mx-auto leading-relaxed">
            Neko-ber connects riders and drivers on the same route in real time.
            Book a seat, offer your car, and negotiate fares directly —
            no middlemen, no fixed prices, just smarter commutes that save
            everyone money.
          </p>

          {/* CTA Button — conditional on auth */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
            {user ? (
              <Link
                href="/dashboard"
                id="hero-dashboard-cta"
                className="inline-flex items-center gap-2.5 py-3.5 px-8 md:py-4 md:px-10 border border-[#173300] rounded-md text-lg lg:text-xl bg-[#173300] hover:opacity-90 text-[#FFEB5B] transition-all font-semibold shadow-[4px_4px_0px_#173300]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 lg:w-6 lg:h-6 fill-[#FFEB5B] shrink-0"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                <span>Dashboard</span>
                <span className="text-xl">→</span>
              </Link>
            ) : (
              <Link
                href="/signup"
                id="hero-get-started-cta"
                className="inline-flex items-center gap-2.5 py-3.5 px-8 md:py-4 md:px-10 border border-[#173300] rounded-md text-lg lg:text-xl bg-[#173300] hover:opacity-90 text-[#FFEB5B] transition-all font-semibold shadow-[4px_4px_0px_#173300]"
              >
                <span>Get Started</span>
                <span className="text-xl">→</span>
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Lottie Animation — Maximum Full Width */}
      <div className="w-full relative z-10 -mt-32 md:-mt-40 flex justify-center overflow-hidden">
        <div className="w-full max-w-[1920px] px-0">
          <DotLottieReact
            src="https://lottie.host/26a8e3ee-0d74-45b8-b474-30e29afaadd8/0Z6eAfaekV.lottie"
            loop
            autoplay
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>
    </div>
  );
}
