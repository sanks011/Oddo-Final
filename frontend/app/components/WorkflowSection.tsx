"use client";

import Link from "next/link";

export default function WorkflowSection() {
  return (
    <section className="w-full pt-10 md:pt-20 lg:pt-37.5 px-4">
      <div className="max-w-[1320px] mx-auto space-y-6 md:space-y-10">
        {/* How It Works Header */}
        <img
          src="/how-it-work-title.svg"
          alt="How it works title"
          width="400"
          height="50"
          className="h-12.5 mx-auto"
        />

        <h2 className="font-heading text-3xl md:text-5xl lg:text-[72px] font-extrabold text-center text-[#173300] leading-[1.2]">
          Turn meetings, notes, and Figma comments into projects and briefs.
        </h2>

        {/* Meeting Flow Banner Graphic */}
        <img
          src="/meeting-flow.png"
          alt="Workflow showing how meetings become projects and briefs"
          width="1320"
          height="240"
          className="w-full h-auto"
        />
      </div>

      {/* Paragraph spans FULL section width — matches saybriefly.com */}
      <p className="text-black text-lg md:text-2xl lg:text-[34px] text-center leading-relaxed md:leading-10 lg:leading-12 mt-6 md:mt-10">
        From meetings, notes, to Figma comments, every conversation becomes a structured project or a locked brief. And as the work evolves, SayBriefly makes sure nothing strays from what<span className="relative">you agreed to.<img src="/arrow-to-scope.svg" alt="" width="307" height="236" className="absolute -left-2 top-0 max-w-75 hidden md:block pointer-events-none" /></span> So when things change, you're ready.
      </p>

      {/* Scope Section - constrained container */}
      <div className="max-w-[1280px] mx-auto space-y-8 md:space-y-12 px-0">
        {/* Scope Title Graphics */}
        <img
          src="/scope-title.svg"
          id="scope"
          alt="Scope Creep Detection"
          width="212"
          height="43"
          className="mt-10 md:mt-20 lg:mt-46 mx-auto scroll-mt-28"
        />
        <img
          src="/scope-eye.png"
          alt="Scope eye icon"
          width="124"
          height="66"
          className="mx-auto mt-4 mb-6"
        />

        <div className="space-y-4 text-center">
          <h3 className="text-center text-[#173300] text-2xl md:text-4xl lg:text-6xl font-semibold leading-tight">
            No more scope creep. <br /> No more free rounds of revisions.
          </h3>
          <p className="w-full md:max-w-2xl lg:w-[800px] mx-auto text-center text-lime-950 text-base md:text-xl lg:text-2xl font-light leading-relaxed">
            Every conversation your client has with you is measured against the original brief.
            <br />
            The moment something changes, you know. Before you've already done the work.
          </p>
        </div>

        {/* Scope Head Graphic */}
        <img
          src="/scope-head.svg"
          alt="Scope Head workflow diagram"
          width="1320"
          height="63"
          className="w-full h-auto my-6"
        />

        {/* Screen Demos Row: Meeting & Transcript */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center">
          <img
            src="/meeting.png"
            alt="SayBriefly meeting transcription interface"
            width="560"
            height="537"
            className="w-full md:w-[45%] h-auto"
          />
          <img
            src="/transcript.png"
            alt="SayBriefly meeting transcript view"
            width="741"
            height="537"
            className="w-full md:w-[55%] h-auto"
          />
        </div>

        {/* Integration Rows with Dotted Dividers */}
        <div className="space-y-10 pt-8">
          {/* Inbox Row */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 pb-10 border-b border-dotted border-[#DD6C3E]">
            <div className="w-full md:w-[45%] space-y-3">
              <h4 className="text-[#173300] text-xl md:text-2xl lg:text-3xl font-semibold leading-tight">
                Even in your <span className="text-sky-600">i</span><span className="text-red-600">n</span><span className="text-amber-400">b</span><span className="text-sky-600">o</span><span className="text-green-600">x</span><span className="text-lime-950">.</span>
              </h4>
              <p className="text-[#173300] text-base md:text-lg lg:text-xl font-light leading-relaxed">
                Client emails are where scope changes sound the most casual. SayBriefly catches them anyway.
              </p>
              <p className="text-neutral-600 text-base font-light italic">Integrates with Gmail</p>
            </div>
            <img
              src="/inbox-client.svg"
              alt="Gmail inbox integration showing scope change detection"
              width="741"
              height="127"
              className="w-full md:w-[55%] h-auto"
            />
          </div>

          {/* Figma Row */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 pb-10 border-b border-dotted border-[#DD6C3E]">
            <div className="w-full md:w-[45%] space-y-3">
              <h4 className="text-[#173300] text-xl md:text-2xl lg:text-3xl font-semibold leading-tight">
                We're in Figma too.
              </h4>
              <p className="text-[#173300] text-base md:text-lg lg:text-xl font-light leading-relaxed">
                SayBriefly monitors every comment against your locked brief and flags anything that wasn't agreed to.
              </p>
              <p className="text-neutral-600 text-base font-light italic">Integrates with Figma</p>
            </div>
            <img
              src="/client.png"
              alt="Figma integration showing comment monitoring"
              width="741"
              height="127"
              className="w-full md:w-[55%] h-auto"
            />
          </div>

          {/* Slack Row */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 pb-10 border-b border-dotted border-[#DD6C3E]">
            <div className="w-full md:w-[45%] space-y-3">
              <h4 className="text-[#173300] text-xl md:text-2xl lg:text-3xl font-semibold leading-tight">
                And in your client's Slack.
              </h4>
              <p className="text-[#173300] text-base md:text-lg lg:text-xl font-light leading-relaxed">
                Scope changes slip into Slack as casual messages. SayBriefly reads every channel before you reply.
              </p>
              <p className="text-neutral-600 text-base font-light italic">Integrates with Slack</p>
            </div>
            <img
              src="/slack-client.png"
              alt="Slack channel integration showing scope change alerts"
              width="741"
              height="127"
              className="w-full md:w-[55%] h-auto"
            />
          </div>
        </div>

        {/* Flag & Notification Explainer */}
        <div className="text-center py-6 space-y-4">
          <img
            src="/flag.png"
            alt="Briefly flag"
            width="192"
            height="192"
            className="mx-auto"
          />
          <p className="text-center text-black text-lg md:text-2xl lg:text-3xl font-normal leading-relaxed max-w-4xl mx-auto">
            The moment something falls outside your brief, you get a notification with the full context of where it came from. You decide whether to absorb it, bill for it, or push back.
          </p>
        </div>

        <hr className="w-full my-12 h-0 border border-dotted border-[#DD6C3E]" />

        {/* Annual Protection Headline with /bg.svg Wash */}
        <div className="text-center space-y-4 pb-12">
          <h3 className="font-heading text-3xl md:text-5xl lg:text-[68px] font-extrabold text-[#173300] leading-[1.2]">
            Freelancers using SayBriefly protects{" "}
            <span className="relative inline-block">
              $3,000+
              <img
                src="/bg.svg"
                alt=""
                width="271"
                height="84"
                className="absolute inset-0 w-full h-full scale-110 -z-10"
              />
            </span>{" "}
            in billable work annually.
          </h3>
          <p className="text-center text-[#173300] text-base md:text-xl lg:text-2xl font-light">
            For a 5-person agency, that's $15,000+ every year.
          </p>
        </div>
      </div>
    </section>
  );
}
