"use client";

import Link from "next/link";

export default function LandingHero() {
  return (
    <div className="relative pt-6">
      {/* Background Radial Glow */}
      <div className="bg-[radial-gradient(ellipse_at_50%_0%,#ffec5b25_0%,transparent_70%)] h-80 md:h-120 lg:h-150 w-full absolute top-0 left-0 z-1 pointer-events-none"></div>

      {/* Main Text Content Overlay */}
      <div className="relative z-10">
        <div className="container flex flex-col items-center gap-4 lg:gap-6 py-8 lg:py-12 px-4 max-w-[1280px] mx-auto text-center">
          {/* Hero Title Badge Graphic */}
          <img
            src="/hero-title.svg"
            alt="Hero Badge Title"
            width="469"
            height="45"
            className="max-w-55 md:max-w-85 lg:max-w-117.25 pointer-events-none mx-auto"
          />

          {/* Hero Display Heading */}
          <h1 className="font-heading text-3xl md:text-5xl lg:text-[64px] xl:text-[80px] font-extrabold text-center mt-4 lg:mt-6 text-[#173300] leading-[1.05]">
            Deliver what was agreed. <br className="hidden md:block" />
            And stop scope creep &amp; stockouts.
          </h1>

          {/* Hero Subhead */}
          <p className="text-black text-base md:text-[20px] text-center w-full max-w-3xl mx-auto leading-relaxed">
            SayBriefly &amp; OddoStock turn every communication and receiving manifest into tasks, deliverables, and inventory checkpoints. Then monitors every project, meeting, and barcode scan against your locked brief. So you always know what was agreed and what just changed.
          </p>

          {/* Download & App CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 py-3 px-6 md:py-3.5 md:px-8 border border-[#173300] rounded-md text-base lg:text-xl bg-[#173300] hover:opacity-90 text-[#FFEB5B] transition-all font-semibold shadow-[4px_4px_0px_#173300]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 lg:w-6 lg:h-6 fill-[#FFEB5B] shrink-0">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"></path>
              </svg>
              <span>Launch Live App Hub</span>
              <span className="text-xl">→</span>
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="text-[#173300] text-sm text-center -mt-1 underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            Looking for live inventory management sandbox? Click here →
          </Link>
        </div>
      </div>

      {/* Dark Green Video & Feature Banner Section matching saybriefly.com */}
      <div className="bg-[#0A3400] min-h-25 pt-8 pb-12 md:pt-14 md:pb-16 mt-4">
        <div className="container px-4 md:px-6 max-w-[1200px] mx-auto flex flex-col items-center gap-8 md:gap-12">
          {/* Embedded Product Introduction Video */}
          <video
            src="/intro.mp4"
            muted
            autoPlay
            loop
            playsInline
            title="SayBriefly product introduction video"
            className="rounded-xl w-full border-2 border-[#FFEB5B]/30 shadow-2xl"
          />

          {/* Hero Feature Info Graphic */}
          <img
            src="/hero-info.svg"
            alt="SayBriefly features: meeting transcription, scope detection, and project briefs"
            width="1920"
            height="800"
            className="w-full h-auto max-w-full"
          />
        </div>
      </div>
    </div>
  );
}
