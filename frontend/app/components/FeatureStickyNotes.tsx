"use client";

export default function FeatureStickyNotes() {
  const features = [
    {
      surface: "surface-mint",
      badge: "01 • AUDIT & VELOCITY",
      title: "Real-Time SKU Tracking",
      description:
        "Instant quantity sync across all bins, racks, and assembly stations. See exactly what is in stock down to the individual component reel.",
      highlight: "99.8% Audit Precision",
      tagColor: "bg-[#1a3300] text-[#fcfaf5]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a3300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
    },
    {
      surface: "surface-teal",
      badge: "02 • AUTOMATED PO REORDER",
      title: "Low-Stock Alerts & Auto-PO",
      description:
        "Never run out of critical ICs or fasteners again. Set threshold points and automatically trigger supplier purchase orders before stock hits zero.",
      highlight: "Zero Manufacturing Stoppage",
      tagColor: "bg-[#1a3300] text-[#fcfaf5]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a3300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
    },
    {
      surface: "surface-blush",
      badge: "03 • MULTI-LOCATION SYNC",
      title: "Multi-Warehouse Routing",
      description:
        "Manage main depots, secondary overflow hubs, and transit vans in one unified view. Move stock with 1-click transfer manifests.",
      highlight: "Seamless Multi-Depot Sync",
      tagColor: "bg-[#1a3300] text-[#fcfaf5]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a3300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      ),
    },
    {
      surface: "surface-yellow",
      badge: "04 • BARCODE & SERIALS",
      title: "QR & 1D Barcode Scanner",
      description:
        "Use any mobile camera, handheld scanner, or USB reader to scan reels, boxes, and serial numbers directly into your inventory.",
      highlight: "3.5x Faster Receiving",
      tagColor: "bg-[#1a3300] text-[#fcfaf5]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a3300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2 M17 3h2a2 2 0 0 1 2 2v2 M21 17v2a2 2 0 0 1-2 2h-2 M7 21H5a2 2 0 0 1-2-2v-2"></path>
          <rect x="7" y="7" width="10" height="10" rx="1"></rect>
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffe95c] border border-[#1a3300] rounded-[6px] text-[12px] font-semibold text-[#1a3300] mb-3 shadow-[2px_2px_0px_#1a3300]">
          <span className="font-code uppercase tracking-wider">📌 STICKY NOTE ARCHITECTURE</span>
        </div>
        <h2 className="font-display text-[40px] sm:text-[55px] text-[#1a3300] leading-tight mb-4">
          BUILT FOR SPEED. STYLED FOR <span className="highlight-wash border border-[#1a3300]">CLARITY</span>.
        </h2>
        <p className="font-body text-[18px] text-[#1a3300] max-w-[640px] mx-auto">
          Every tool is designed to eliminate friction between receiving stock, fulfilling orders, and preventing stockouts.
        </p>
      </div>

      {/* 2x2 Grid of Sticky Note Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {features.map((item, idx) => (
          <div
            key={idx}
            className={`${item.surface} rounded-[16px] p-6 sm:p-8 flex flex-col justify-between relative group hover:translate-y-[-2px] transition-transform duration-200 shadow-[4px_4px_0px_#1a3300]`}
          >
            {/* Top Card Bar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-code text-xs font-bold text-[#1a3300] bg-[#fcfaf5] border border-[#1a3300] px-2.5 py-1 rounded-[6px]">
                  {item.badge}
                </span>
                <div className="p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[8px]">
                  {item.icon}
                </div>
              </div>

              {/* Title & Body */}
              <h3 className="font-display text-[28px] sm:text-[32px] text-[#1a3300] leading-snug mb-3">
                {item.title}
              </h3>
              <p className="font-body text-[16px] text-[#1a3300] leading-relaxed mb-6 font-normal">
                {item.description}
              </p>
            </div>

            {/* Bottom Highlight Tag */}
            <div className="pt-4 border-t border-[#1a3300]/20 flex items-center justify-between">
              <span className={`font-code text-xs font-semibold px-3 py-1 rounded-full border border-[#1a3300] ${item.tagColor}`}>
                ✓ {item.highlight}
              </span>
              <span className="font-code text-xs text-[#1a3300] font-bold group-hover:translate-x-1 transition-transform">
                Explore feature →
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
