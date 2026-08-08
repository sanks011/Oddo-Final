"use client";

import Navbar from "./components/Navbar";
import LandingHero from "./components/LandingHero";
import WorkflowSection from "./components/WorkflowSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] text-[#173300] font-sans selection:bg-[#FFEB5B]">
      {/* 1. Header Navbar */}
      <Navbar />

      <main className="flex-grow">
        {/* 2. Hero + Lottie banner */}
        <LandingHero />

        {/* 3. How It Works + Scope Creep Section */}
        <WorkflowSection />
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
