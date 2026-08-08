"use client";

import { useState } from "react";
import Link from "next/link";

interface PreviewItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minReorder: number;
  price: number;
  warehouse: string;
  status: "In Stock" | "Low Stock" | "Reordered";
}

const initialPreviewData: PreviewItem[] = [
  {
    id: "1",
    sku: "RES-10K-0805",
    name: "SMD Resistor 10k Ohm 1/8W",
    category: "Passives",
    stock: 4500,
    minReorder: 1000,
    price: 0.02,
    warehouse: "Depot Alpha",
    status: "In Stock",
  },
  {
    id: "2",
    sku: "MCU-ESP32-S3",
    name: "ESP32-S3 Dual Core Wi-Fi/BT SoC",
    category: "Microcontrollers",
    stock: 84,
    minReorder: 200,
    price: 3.45,
    warehouse: "Depot Alpha",
    status: "Low Stock",
  },
  {
    id: "3",
    sku: "SENS-BME280",
    name: "BME280 Humidity & Temp Sensor",
    category: "Sensors",
    stock: 620,
    minReorder: 150,
    price: 2.10,
    warehouse: "East Hub",
    status: "In Stock",
  },
  {
    id: "4",
    sku: "BAT-LIPO-2000",
    name: "LiPo Cell 3.7V 2000mAh JST-PH",
    category: "Power",
    stock: 12,
    minReorder: 100,
    price: 5.80,
    warehouse: "East Hub",
    status: "Reordered",
  },
];

export default function InteractivePreview() {
  const [items, setItems] = useState<PreviewItem[]>(initialPreviewData);
  const [activeWarehouse, setActiveWarehouse] = useState<string>("All");
  const [lastScannedSku, setLastScannedSku] = useState<string | null>(null);
  const [scanNotification, setScanNotification] = useState<string | null>(null);

  const filteredItems = activeWarehouse === "All"
    ? items
    : items.filter((item) => item.warehouse === activeWarehouse);

  const simulateBarcodeScan = () => {
    // Pick random item to scan
    const randomIndex = Math.floor(Math.random() * items.length);
    const targetItem = items[randomIndex];
    
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === targetItem.id) {
          const newQty = item.stock + 25;
          let newStatus = item.status;
          if (newQty > item.minReorder) {
            newStatus = "In Stock";
          }
          return { ...item, stock: newQty, status: newStatus };
        }
        return item;
      })
    );

    setLastScannedSku(targetItem.sku);
    setScanNotification(`Scanned SKU ${targetItem.sku} (+25 units checked in)`);
    setTimeout(() => setScanNotification(null), 3000);
  };

  return (
    <section id="preview" className="py-12 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d5f5c2] border border-[#1a3300] rounded-full text-[12px] font-semibold text-[#1a3300] mb-3">
          <span>✨ LIVE INTERACTIVE SANDBOX</span>
        </div>
        <h2 className="font-display text-[36px] sm:text-[48px] text-[#1a3300] leading-none mb-3">
          SEE HOW ODDO<span className="text-[#cb5521]">STOCK</span> OPERATES
        </h2>
        <p className="font-body text-[16px] sm:text-[18px] text-[#1a3300] max-w-[600px] mx-auto">
          Test live SKU incrementing, instant low-stock triggers, and warehouse location toggles in real-time below.
        </p>
      </div>

      {/* Main Sandbox Container Card */}
      <div className="bg-[#fcfaf5] border-2 border-[#1a3300] rounded-[16px] p-4 sm:p-6 shadow-[6px_6px_0px_#1a3300]">
        {/* Sandbox Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1a3300]/20 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-code text-xs font-semibold uppercase text-[#767676]">Warehouse:</span>
            {["All", "Depot Alpha", "East Hub"].map((wh) => (
              <button
                key={wh}
                onClick={() => setActiveWarehouse(wh)}
                className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-colors border border-[#1a3300] ${
                  activeWarehouse === wh
                    ? "bg-[#1a3300] text-[#fcfaf5]"
                    : "bg-[#fcfaf5] text-[#1a3300] hover:bg-[#ffe95c]"
                }`}
              >
                {wh}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={simulateBarcodeScan}
              className="btn-pastel-mint border border-[#1a3300] px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 shadow-[2px_2px_0px_#1a3300] hover:translate-y-[-1px] transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 7V5a2 2 0 0 1 2-2h2 M17 3h2a2 2 0 0 1 2 2v2 M21 17v2a2 2 0 0 1-2 2h-2 M7 21H5a2 2 0 0 1-2-2v-2"></path>
                <line x1="7" y1="8" x2="7" y2="16"></line>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="17" y1="8" x2="17" y2="16"></line>
              </svg>
              <span>Simulate Barcode Scan (+25)</span>
            </button>
            <Link
              href="/dashboard"
              className="btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1 border border-[#1a3300]"
            >
              <span>Full App</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Scan Notification Banner */}
        {scanNotification && (
          <div className="mb-4 bg-[#ffe95c] border border-[#1a3300] rounded-[8px] p-2.5 px-4 font-code text-xs font-semibold text-[#1a3300] flex items-center justify-between animate-bounce">
            <span>⚡ BARCODE SCANNER: {scanNotification}</span>
            <span className="text-[10px] uppercase bg-[#1a3300] text-[#fcfaf5] px-2 py-0.5 rounded">
              AUTO-UPDATED
            </span>
          </div>
        )}

        {/* Stock Items Table */}
        <div className="overflow-x-auto border border-[#1a3300] rounded-[10px] bg-[#fcfaf5]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f1f1] border-b border-[#1a3300] font-code text-xs text-[#1a3300]">
                <th className="p-3 font-semibold">SKU CODE</th>
                <th className="p-3 font-semibold">ITEM DESCRIPTION</th>
                <th className="p-3 font-semibold">CATEGORY</th>
                <th className="p-3 font-semibold">STOCK QTY</th>
                <th className="p-3 font-semibold">STATUS</th>
                <th className="p-3 font-semibold">DEPOT</th>
                <th className="p-3 font-semibold text-right">QUICK ADJUST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#b6b6b6]/50 text-sm font-body">
              {filteredItems.map((item) => {
                const isHighlight = lastScannedSku === item.sku;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-[#f1f1f1]/60 ${
                      isHighlight ? "bg-[#ffe95c]/40 font-semibold" : ""
                    }`}
                  >
                    <td className="p-3 font-code text-xs font-bold text-[#1a3300]">
                      {item.sku}
                    </td>
                    <td className="p-3 font-medium text-[#1a3300]">
                      {item.name}
                    </td>
                    <td className="p-3">
                      <span className="font-code text-[11px] bg-[#a8e5e5]/50 border border-[#1a3300]/40 px-2 py-0.5 rounded-[#4px] text-[#1a3300]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-code font-bold text-[#1a3300]">
                      {item.stock.toLocaleString()} units
                    </td>
                    <td className="p-3">
                      {item.status === "In Stock" && (
                        <span className="inline-flex items-center gap-1 bg-[#d5f5c2] border border-[#1a3300] px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#1a3300]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1a3300]"></span>
                          In Stock
                        </span>
                      )}
                      {item.status === "Low Stock" && (
                        <span className="inline-flex items-center gap-1 bg-[#ffe95c] border border-[#1a3300] px-2.5 py-0.5 rounded-full text-xs font-bold text-[#1a3300]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#cb5521]"></span>
                          Low Stock
                        </span>
                      )}
                      {item.status === "Reordered" && (
                        <span className="inline-flex items-center gap-1 bg-[#f6d0ff] border border-[#1a3300] px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#1a3300]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1a3300]"></span>
                          PO Sent
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-code text-xs text-[#767676]">
                      {item.warehouse}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id && i.stock > 0
                                  ? { ...i, stock: i.stock - 10 }
                                  : i
                              )
                            );
                          }}
                          className="w-6 h-6 border border-[#1a3300] rounded bg-[#fcfaf5] text-xs font-bold hover:bg-[#f6d0ff] transition-colors flex items-center justify-center"
                          title="Deduct 10"
                        >
                          -
                        </button>
                        <button
                          onClick={() => {
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? { ...i, stock: i.stock + 10 }
                                  : i
                              )
                            );
                          }}
                          className="w-6 h-6 border border-[#1a3300] rounded bg-[#fcfaf5] text-xs font-bold hover:bg-[#d5f5c2] transition-colors flex items-center justify-center"
                          title="Add 10"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info in sandbox */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-[#767676] font-code pt-3 border-t border-[#b6b6b6]/30">
          <span>* Sandbox data updates client-side instantly.</span>
          <span className="text-[#1a3300] font-semibold">
            Try the full interactive dashboard with search & add SKU features →
          </span>
        </div>
      </div>
    </section>
  );
}
