"use client";

import Navbar from "./components/Navbar";
import LandingHero from "./components/LandingHero";
import WorkflowSection from "./components/WorkflowSection";
import AgentSection from "./components/AgentSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] text-[#173300] font-sans selection:bg-[#FFEB5B]">
      {/* 1. Header Navbar */}
      <Navbar />

      <main className="flex-grow">
        {/* 2. Hero Section with Video Banner */}
        <LandingHero />

        {/* 3. How It Works & Scope Creep Prevention Section */}
        <WorkflowSection />

        {/* 4. Scribbble Agent & Capabilities Section */}
        <AgentSection />
      </main>

      {/* 5. Footer with Newsletter & Artwork */}
      <Footer />
    </div>
  );
}
