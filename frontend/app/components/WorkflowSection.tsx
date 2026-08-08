"use client";

export default function WorkflowSection() {
  return (
    <section className="w-full pt-2 md:pt-4 px-4">
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
          Sign up, find your route, and start saving on every trip.
        </h2>

        {/* Meeting Flow Banner Graphic */}
        <img
          src="/meeting-flow.png"
          alt="How carpooling works — find a route, match with riders, ride together"
          width="1320"
          height="240"
          className="w-full h-auto"
        />
      </div>

      {/* Full-width paragraph */}
      <p className="text-black text-lg md:text-2xl lg:text-[34px] text-center leading-relaxed md:leading-10 lg:leading-12 mt-6 md:mt-10 px-4 max-w-[1320px] mx-auto">
        From finding a nearby driver to negotiating the fare, every step is
        transparent and in your control. Whether you&apos;re a rider or a
        driver, Neko-ber makes sure{" "}
        <span className="relative">
          every seat is filled
          <img
            src="/arrow-to-scope.svg"
            alt=""
            width="307"
            height="236"
            className="absolute -left-2 top-0 max-w-75 hidden md:block pointer-events-none"
          />
        </span>{" "}
        and every fare is fair.
      </p>

      {/* USP Section */}
      <div className="max-w-[1280px] mx-auto space-y-8 md:space-y-12 px-0">
        {/* Section Badge */}
        <img
          src="/scope-title.svg"
          id="scope"
          alt="Negotiate Fares"
          width="212"
          height="43"
          className="mt-10 md:mt-20 lg:mt-46 mx-auto scroll-mt-28"
        />

        <div className="space-y-4 text-center">
          <h3 className="text-center text-[#173300] text-2xl md:text-4xl lg:text-6xl font-semibold leading-tight">
            No fixed fares. <br /> No empty seats. <br /> No commuting alone.
          </h3>
          <p className="w-full md:max-w-2xl lg:w-[800px] mx-auto text-center text-lime-950 text-base md:text-xl lg:text-2xl font-light leading-relaxed">
            Riders propose their price, drivers counter — both sides win.
            <br />
            Our built-in negotiation engine makes every carpool a fair deal.
          </p>
        </div>

        {/* Scope Head Graphic */}
        <img
          src="/scope-head.svg"
          alt="Carpooling workflow diagram"
          width="1320"
          height="63"
          className="w-full h-auto my-6"
        />

        {/* Screen Demos Row */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-center">
          <img
            src="/meeting.png"
            alt="Rider booking interface"
            width="560"
            height="537"
            className="w-full md:w-[45%] h-auto"
          />
          <img
            src="/transcript.png"
            alt="Driver offer and negotiation view"
            width="741"
            height="537"
            className="w-full md:w-[55%] h-auto"
          />
        </div>

        {/* Feature Rows */}
        <div className="space-y-10 pt-8">
          {/* Book a Ride */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 pb-10 border-b border-[#B6B6B6]/40">
            <div className="w-full md:w-[45%] space-y-3">
              <h4 className="text-[#173300] text-xl md:text-2xl lg:text-3xl font-semibold leading-tight">
                Find a ride on your exact route.
              </h4>
              <p className="text-[#173300] text-base md:text-lg lg:text-xl font-light leading-relaxed">
                Enter your pickup and drop-off — Neko-ber matches you with drivers
                already heading that way. No detours, no wasted time.
              </p>
              <p className="text-neutral-600 text-base font-light italic">
                Real-time route matching
              </p>
            </div>
            <img
              src="/inbox-client.svg"
              alt="Ride booking interface"
              width="741"
              height="127"
              className="w-full md:w-[55%] h-auto"
            />
          </div>

          {/* Offer a Ride */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 pb-10 border-b border-[#B6B6B6]/40">
            <div className="w-full md:w-[45%] space-y-3">
              <h4 className="text-[#173300] text-xl md:text-2xl lg:text-3xl font-semibold leading-tight">
                Offer your seat. Earn on every commute.
              </h4>
              <p className="text-[#173300] text-base md:text-lg lg:text-xl font-light leading-relaxed">
                Already driving somewhere? List your route, set your preferred
                fare, and let riders come to you. Turn daily drives into savings.
              </p>
              <p className="text-neutral-600 text-base font-light italic">
                Driver fare management
              </p>
            </div>
            <img
              src="/client.png"
              alt="Driver offer interface"
              width="741"
              height="127"
              className="w-full md:w-[55%] h-auto"
            />
          </div>

          {/* Negotiate */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 pb-10 border-b border-[#B6B6B6]/40">
            <div className="w-full md:w-[45%] space-y-3">
              <h4 className="text-[#173300] text-xl md:text-2xl lg:text-3xl font-semibold leading-tight">
                Negotiate. Our biggest USP.
              </h4>
              <p className="text-[#173300] text-base md:text-lg lg:text-xl font-light leading-relaxed">
                Unlike any other carpool app — riders can counter a fare,
                drivers can accept or propose a new price. Both sides chat,
                agree, and ride. Fair fares, every time.
              </p>
              <p className="text-neutral-600 text-base font-light italic">
                In-app fare negotiation
              </p>
            </div>
            <img
              src="/slack-client.png"
              alt="Fare negotiation interface"
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
            alt="Ride confirmed"
            width="192"
            height="192"
            className="mx-auto"
          />
          <p className="text-center text-black text-lg md:text-2xl lg:text-3xl font-normal leading-relaxed max-w-4xl mx-auto">
            The moment a driver accepts your fare, you get a confirmation with
            pickup details, driver info, and live tracking — all in one place.
          </p>
        </div>

        <hr className="w-full my-12 h-0 border border-[#B6B6B6]/30" />

        {/* Impact Stat */}
        <div className="text-center space-y-4 pb-12">
          <h3 className="font-heading text-3xl md:text-5xl lg:text-[68px] font-extrabold text-[#173300] leading-[1.2]">
            Riders on Neko-ber save{" "}
            <span className="relative inline-block">
              ₹3,000+
              <img
                src="/bg.svg"
                alt=""
                width="271"
                height="84"
                className="absolute inset-0 w-full h-full scale-110 -z-10"
              />
            </span>{" "}
            on commutes every month.
          </h3>
          <p className="text-center text-[#173300] text-base md:text-xl lg:text-2xl font-light">
            For a team of 5 sharing a route, that&apos;s ₹15,000+ saved monthly.
          </p>
        </div>
      </div>
    </section>
  );
}
