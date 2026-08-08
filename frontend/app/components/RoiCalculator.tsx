"use client";

import { useState } from "react";
import Link from "next/link";

export default function RoiCalculator() {
  const [skuCount, setSkuCount] = useState<number>(2500);
  const [monthlyOrders, setMonthlyOrders] = useState<number>(1200);

  // ROI Math
  // Average discrepancy loss per SKU per year = ~$12.50
  // Time saved per audit per 500 SKUs = ~8 hours/month
  const annualSavings = Math.round(skuCount * 14.5 + monthlyOrders * 4.2);
  const hoursSavedPerMonth = Math.round((skuCount / 200) * 3.5);
  const auditSpeedup = "4.2x";

  return (
    <section id="roi" className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      <div className="bg-[#fcfaf5] border-2 border-[#1a3300] rounded-[16px] p-6 sm:p-10 shadow-[6px_6px_0px_#1a3300]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Sliders */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f6d0ff] border border-[#1a3300] rounded-[6px] text-[12px] font-semibold text-[#1a3300] mb-4">
              <span className="font-code uppercase tracking-wider">📊 LIVE ROI IMPACT CALCULATOR</span>
            </div>
            <h2 className="font-display text-[32px] sm:text-[44px] text-[#1a3300] leading-none mb-3">
              CALCULATE YOUR <span className="highlight-wash border border-[#1a3300]">SAVINGS</span>
            </h2>
            <p className="font-body text-[16px] text-[#1a3300] mb-8">
              Adjust your inventory scale below to estimate instant financial and labor savings with OddoStock.
            </p>

            {/* Slider 1: SKU Count */}
            <div className="mb-6 bg-[#f1f1f1]/60 p-4 border border-[#1a3300] rounded-[10px]">
              <div className="flex justify-between items-center mb-2">
                <label className="font-code text-xs font-bold text-[#1a3300] uppercase">
                  Active Managed SKUs:
                </label>
                <span className="font-code text-base font-bold bg-[#ffe95c] border border-[#1a3300] px-2.5 py-0.5 rounded-[#4px] text-[#1a3300]">
                  {skuCount.toLocaleString()} SKUs
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={skuCount}
                onChange={(e) => setSkuCount(Number(e.target.value))}
                className="w-full h-2 bg-[#b6b6b6] rounded-lg appearance-none cursor-pointer accent-[#1a3300]"
              />
              <div className="flex justify-between text-[11px] font-code text-[#767676] mt-1">
                <span>100 SKUs</span>
                <span>5,000 SKUs</span>
                <span>10,000+ SKUs</span>
              </div>
            </div>

            {/* Slider 2: Monthly Orders */}
            <div className="bg-[#f1f1f1]/60 p-4 border border-[#1a3300] rounded-[10px]">
              <div className="flex justify-between items-center mb-2">
                <label className="font-code text-xs font-bold text-[#1a3300] uppercase">
                  Monthly Orders Fulfillments:
                </label>
                <span className="font-code text-base font-bold bg-[#a8e5e5] border border-[#1a3300] px-2.5 py-0.5 rounded-[#4px] text-[#1a3300]">
                  {monthlyOrders.toLocaleString()} Orders
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={monthlyOrders}
                onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                className="w-full h-2 bg-[#b6b6b6] rounded-lg appearance-none cursor-pointer accent-[#1a3300]"
              />
              <div className="flex justify-between text-[11px] font-code text-[#767676] mt-1">
                <span>100 Orders</span>
                <span>2,500 Orders</span>
                <span>5,000+ Orders</span>
              </div>
            </div>
          </div>

          {/* Right Column: Output Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#d5f5c2] border-2 border-[#1a3300] rounded-[14px] p-6 text-center shadow-[4px_4px_0px_#1a3300]">
              <span className="font-code text-xs font-bold text-[#1a3300] uppercase bg-[#fcfaf5] border border-[#1a3300] px-3 py-1 rounded-full">
                ESTIMATED ANNUAL IMPACT
              </span>

              <div className="my-6">
                <span className="font-display text-[48px] sm:text-[56px] text-[#1a3300] leading-none block">
                  ${annualSavings.toLocaleString()}
                </span>
                <span className="font-body text-xs text-[#1a3300] font-semibold mt-1 block">
                  Annual Shrinkage & Write-Off Savings
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#1a3300]/20 mb-6 text-left">
                <div className="bg-[#fcfaf5] border border-[#1a3300] p-3 rounded-[8px]">
                  <span className="font-display text-2xl text-[#1a3300] block">
                    {hoursSavedPerMonth} hrs
                  </span>
                  <span className="font-code text-[11px] text-[#767676]">
                    Audit Time Saved/Mo
                  </span>
                </div>
                <div className="bg-[#fcfaf5] border border-[#1a3300] p-3 rounded-[8px]">
                  <span className="font-display text-2xl text-[#cb5521] block">
                    {auditSpeedup}
                  </span>
                  <span className="font-code text-[11px] text-[#767676]">
                    Audit Speedup Ratio
                  </span>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full btn-primary text-sm py-3 px-4 flex items-center justify-center gap-2 border border-[#1a3300] shadow-[2px_2px_0px_#ffe95c]"
              >
                <span>Start Saving in Sandbox</span>
                <span className="text-[#ffe95c]">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
