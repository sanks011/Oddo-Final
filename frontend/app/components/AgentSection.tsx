"use client";

import { useState } from "react";

export default function AgentSection() {
  const [activeChatIndex, setActiveChatIndex] = useState<number>(1);

  const agentPills = [
    {
      index: 1,
      title: "Scope change detection & prevention",
      chatSrc: "/agent-chat/1.svg",
    },
    {
      index: 2,
      title: "Project boards & task management",
      chatSrc: "/agent-chat/2.svg",
    },
    {
      index: 3,
      title: "Todo-list and action items",
      chatSrc: "/agent-chat/3.svg",
    },
    {
      index: 4,
      title: "Smart search across all meetings & emails",
      chatSrc: "/agent-chat/4.svg",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Wavy Line Transition Graphic */}
      <div id="line1-wrap" className="block w-full relative z-0">
        <img src="/line1.svg" alt="" width="1920" height="1080" className="block w-full h-auto" />
      </div>

      {/* Agent Section Main Block */}
      <section id="agent" className="container max-w-[1280px] mx-auto px-4 pt-10 pb-20 scroll-mt-28">
        <p className="text-center text-lime-950 text-sm font-normal uppercase leading-4 tracking-widest mb-4">
          /Agent
        </p>

        {/* Agent Title SVG */}
        <img
          src="/agent-title.svg"
          alt="Scribbble Agent"
          width="405"
          height="43"
          className="mx-auto h-11.5 w-auto mb-8"
        />

        <h3 className="text-center text-[#173300] text-2xl md:text-4xl lg:text-6xl font-semibold leading-tight mb-6 max-w-4xl mx-auto">
          Scribbble{" "}
          <img
            src="/agent.svg"
            alt=""
            width="538"
            height="58"
            className="inline-block -mt-2.5 max-w-45 md:max-w-xs lg:max-w-none h-auto"
          />{" "}
          knows all your projects, emails, and meetings. Just say it. Scribbble's listening.
        </h3>

        <p className="w-full md:max-w-2xl lg:w-[800px] mx-auto text-center text-[#173300] text-base md:text-xl lg:text-2xl font-light leading-relaxed mb-8">
          The world's first agent built specifically for freelancers doing client work. Chat or talk about your meetings, projects, and emails the way your brain actually works.
          <br />
          Oh, and it's a little neurodivergent. Turns out, that's a feature.
        </p>

        {/* Character Graphic */}
        <img
          src="/scribbble.svg"
          alt="Scribbble AI assistant character"
          width="805"
          height="305"
          className="mx-auto mb-8 w-full max-w-sm md:max-w-2xl lg:w-[800px]"
        />

        {/* Dynamic Chat Bubble Display */}
        <div className="max-w-full md:max-w-2xl lg:max-w-[924px] mx-auto mb-10 border-2 border-[#173300] rounded-2xl p-4 bg-[#FCFAF5] shadow-[6px_6px_0px_#173300]">
          <img
            src={`/agent-chat/${activeChatIndex}.svg`}
            alt="Scribbble agent chat capability"
            width="924"
            height="101"
            className="w-full h-auto rounded-lg transition-opacity duration-300"
          />
        </div>

        {/* Agent Capability Pills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {agentPills.map((pill) => {
            const isActive = activeChatIndex === pill.index;
            return (
              <div
                key={pill.index}
                onClick={() => setActiveChatIndex(pill.index)}
                className={`flex items-center justify-between gap-3 rounded-full border-2 border-[#173300] px-5 py-3.5 transition-all duration-300 cursor-pointer ${
                  isActive ? "bg-[#D5F5C2] shadow-[3px_3px_0px_#173300]" : "bg-[#FCFAF5] hover:bg-[#173300]/5"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="font-heading font-semibold text-[#173300] text-sm md:text-base leading-snug">
                    {pill.title}
                  </span>
                </span>
                <span className="w-7 h-7 rounded-full border border-[#173300] bg-[#FCFAF5] flex items-center justify-center font-code text-xs font-bold shrink-0">
                  {isActive ? "✓" : "→"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
