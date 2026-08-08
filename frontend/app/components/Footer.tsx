"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#FCFAF5] text-[#173300]">
      <div className="container max-w-[1280px] mx-auto px-4 pt-12 pb-8">
        {/* Newsletter Subscription Box */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[#173300] pb-10">
          <div className="space-y-2">
            <h3 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#173300]">
              Stay in the loop with SayBriefly &amp; Carpool.
            </h3>
            <p className="font-body text-base text-[#173300]/80">
              Get updates on new integrations, scope creep detection, and inventory management.
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="border-b w-full md:w-[600px] border-[#173300] py-3 flex items-center gap-4"
          >
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Email address"
              className="w-full h-12 text-lg font-medium bg-transparent focus:outline-none text-[#173300]"
            />
            <button
              type="submit"
              className="bg-[#173300] rounded-lg text-[#FFEB5B] text-lg font-semibold py-3 px-6 hover:opacity-90 transition-opacity shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Links & Socials Row */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mt-8 mb-8">
          <ul className="flex flex-wrap gap-6 text-[#173300] font-body text-base">
            <li>
              <Link href="/" className="hover:underline">
                Terms of Use
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:underline">
                Cookie Settings
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="font-semibold text-[#DD6C3E] hover:underline">
                Inventory Hub App →
              </Link>
            </li>
          </ul>

          {/* Social Icons */}
          <ul className="flex items-center gap-8">
            <li>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                <img src="/linkedin.svg" alt="LinkedIn" width="24" height="24" className="h-6 w-auto" />
              </a>
            </li>
            <li>
              <a href="https://x.com" target="_blank" rel="noreferrer">
                <img src="/x.svg" alt="X" width="24" height="24" className="h-6 w-auto" />
              </a>
            </li>
            <li>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                <img src="/insta.svg" alt="Instagram" width="24" height="24" className="h-6 w-auto" />
              </a>
            </li>
          </ul>
        </div>

        {/* Copyright Bar with Dashed Borders */}
        <p className="text-center py-5 border-y border-[#173300] border-dashed text-[#173300] text-base font-normal">
          2026 © SayBriefly &amp; Carpool. All rights reserved. <br className="block md:hidden" />
          Designed by <span className="font-bold">@HustleJar</span>
        </p>
      </div>

      {/* Footer Artwork Image at the bottom */}
      <div className="w-full px-4 pt-4 pb-8">
        <img
          src="/footer-artwork.png"
          alt="Footer Artwork"
          width="2640"
          height="1460"
          className="w-full h-auto max-w-[1400px] mx-auto rounded-xl"
        />
      </div>
    </footer>
  );
}
