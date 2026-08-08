"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: "Microcontrollers" | "Passives" | "Sensors" | "Power" | "Hardware";
  location: string;
  stock: number;
  minReorder: number;
  unitPrice: number;
  warehouse: "Depot Alpha" | "East Hub" | "Overflow West";
  supplier: string;
  status: "In Stock" | "Low Stock" | "Reordered";
  lastUpdated: string;
}

const initialInventory: InventoryItem[] = [
  {
    id: "SKU-001",
    sku: "MCU-ESP32-S3",
    name: "ESP32-S3-WROOM-1 Dual Core Wi-Fi/BT SoC",
    category: "Microcontrollers",
    location: "Rack A-04",
    stock: 84,
    minReorder: 200,
    unitPrice: 3.45,
    warehouse: "Depot Alpha",
    supplier: "Espressif Systems",
    status: "Low Stock",
    lastUpdated: "10 mins ago",
  },
  {
    id: "SKU-002",
    sku: "RES-10K-0805",
    name: "SMD Chip Resistor 10k Ohm 1/8W 1%",
    category: "Passives",
    location: "Bin 12-B",
    stock: 14500,
    minReorder: 2500,
    unitPrice: 0.015,
    warehouse: "Depot Alpha",
    supplier: "Yageo Tech",
    status: "In Stock",
    lastUpdated: "2 mins ago",
  },
  {
    id: "SKU-003",
    sku: "SENS-BME280",
    name: "BME280 Environmental Humidity & Temp Sensor",
    category: "Sensors",
    location: "Rack B-01",
    stock: 620,
    minReorder: 150,
    unitPrice: 2.10,
    warehouse: "East Hub",
    supplier: "Bosch Sensortec",
    status: "In Stock",
    lastUpdated: "1 hour ago",
  },
  {
    id: "SKU-004",
    sku: "BAT-LIPO-2000",
    name: "Rechargeable LiPo Cell 3.7V 2000mAh JST",
    category: "Power",
    location: "Hazard Locker 3",
    stock: 12,
    minReorder: 100,
    unitPrice: 5.80,
    warehouse: "East Hub",
    supplier: "PKCELL Power",
    status: "Reordered",
    lastUpdated: "4 hours ago",
  },
  {
    id: "SKU-005",
    sku: "IC-STM32F401",
    name: "STM32F401RCT6 ARM Cortex-M4 84MHz 256KB",
    category: "Microcontrollers",
    location: "Rack A-02",
    stock: 410,
    minReorder: 100,
    unitPrice: 4.85,
    warehouse: "Depot Alpha",
    supplier: "STMicroelectronics",
    status: "In Stock",
    lastUpdated: "Just now",
  },
  {
    id: "SKU-006",
    sku: "CAP-100UF-25V",
    name: "Aluminum Electrolytic Capacitor 100uF 25V SMD",
    category: "Passives",
    location: "Bin 04-C",
    stock: 3200,
    minReorder: 800,
    unitPrice: 0.08,
    warehouse: "Overflow West",
    supplier: "Nichicon Corp",
    status: "In Stock",
    lastUpdated: "30 mins ago",
  },
  {
    id: "SKU-007",
    sku: "DISP-[#OLED-096]",
    name: "0.96 inch I2C OLED Module 128x64 White",
    category: "Hardware",
    location: "Bin 18-A",
    stock: 45,
    minReorder: 150,
    unitPrice: 2.25,
    warehouse: "Depot Alpha",
    supplier: "Adafruit Ind",
    status: "Low Stock",
    lastUpdated: "Yesterday",
  },
  {
    id: "SKU-008",
    sku: "PWR-LM2596-REG",
    name: "LM2596 DC-DC Buck Converter Step-Down",
    category: "Power",
    location: "Rack C-05",
    stock: 890,
    minReorder: 200,
    unitPrice: 1.15,
    warehouse: "East Hub",
    supplier: "Texas Instruments",
    status: "In Stock",
    lastUpdated: "3 hours ago",
  },
];

interface ActivityLog {
  id: string;
  text: string;
  time: string;
  type: "in" | "out" | "alert" | "add";
}

const initialLogs: ActivityLog[] = [
  {
    id: "l1",
    text: "Received +500 units of RES-10K-0805 into Depot Alpha",
    time: "2 mins ago",
    type: "in",
  },
  {
    id: "l2",
    text: "Issued -25 units of MCU-ESP32-S3 to Assembly Line B",
    time: "10 mins ago",
    type: "out",
  },
  {
    id: "l3",
    text: "Low stock threshold triggered for BAT-LIPO-2000 (12 remaining)",
    time: "4 hours ago",
    type: "alert",
  },
  {
    id: "l4",
    text: "Created new SKU profile for DISP-[#OLED-096]",
    time: "Yesterday",
    type: "add",
  },
];

export default function Dashboard() {
  const router = useRouter();

  // Client-side auth guard (fallback for edge middleware)
  useEffect(() => {
    const hasToken = document.cookie
      .split("; ")
      .some((row) => row.startsWith("auth-token="));
    if (!hasToken) {
      router.replace("/login?from=/dashboard");
    }
  }, [router]);

  const [items, setItems] = useState<InventoryItem[]>(initialInventory);
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("All");
  
  // Add SKU Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<InventoryItem["category"]>("Microcontrollers");
  const [newStock, setNewStock] = useState(100);
  const [newMinReorder, setNewMinReorder] = useState(50);
  const [newPrice, setNewPrice] = useState(2.5);
  const [newLocation, setNewLocation] = useState("Rack A-01");
  const [newWarehouse, setNewWarehouse] = useState<InventoryItem["warehouse"]>("Depot Alpha");

  // Quantity Adjuster Modal State
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "All" || item.status === selectedStatus;

      const matchesWarehouse =
        selectedWarehouse === "All" || item.warehouse === selectedWarehouse;

      return matchesSearch && matchesCategory && matchesStatus && matchesWarehouse;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus, selectedWarehouse]);

  // Metric Computations
  const totalSkuCount = items.length;
  const lowStockCount = items.filter((i) => i.status === "Low Stock").length;
  const reorderedCount = items.filter((i) => i.status === "Reordered").length;
  const totalValuation = items.reduce(
    (acc, curr) => acc + curr.stock * curr.unitPrice,
    0
  );

  // Handle Add Item
  const handleCreateSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName) return;

    const newItem: InventoryItem = {
      id: `SKU-${Date.now().toString().slice(-4)}`,
      sku: newSku.toUpperCase(),
      name: newName,
      category: newCategory,
      location: newLocation,
      stock: Number(newStock),
      minReorder: Number(newMinReorder),
      unitPrice: Number(newPrice),
      warehouse: newWarehouse,
      supplier: "Direct Sourcing",
      status: Number(newStock) <= Number(newMinReorder) ? "Low Stock" : "In Stock",
      lastUpdated: "Just now",
    };

    setItems((prev) => [newItem, ...prev]);
    setLogs((prev) => [
      {
        id: `l-${Date.now()}`,
        text: `Created new SKU ${newItem.sku} (${newItem.name})`,
        time: "Just now",
        type: "add",
      },
      ...prev,
    ]);

    // Reset Form
    setNewSku("");
    setNewName("");
    setIsAddModalOpen(false);
  };

  // Handle Quantity Adjustment
  const handleApplyAdjustment = () => {
    if (!adjustingItem) return;

    const change = adjustType === "add" ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === adjustingItem.id) {
          const updatedStock = Math.max(0, item.stock + change);
          let newStatus: InventoryItem["status"] = item.status;
          if (updatedStock <= item.minReorder) {
            newStatus = "Low Stock";
          } else if (item.status === "Low Stock" && updatedStock > item.minReorder) {
            newStatus = "In Stock";
          }
          return {
            ...item,
            stock: updatedStock,
            status: newStatus,
            lastUpdated: "Just now",
          };
        }
        return item;
      })
    );

    setLogs((prev) => [
      {
        id: `l-${Date.now()}`,
        text: `${adjustType === "add" ? "Checked in" : "Dispatched"} ${Math.abs(adjustAmount)} units of ${adjustingItem.sku}`,
        time: "Just now",
        type: adjustType === "add" ? "in" : "out",
      },
      ...prev,
    ]);

    setAdjustingItem(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfaf5] text-[#1a3300] font-sans selection:bg-[#ffe95c]">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-code text-xs font-bold text-[#1a3300] bg-[#ffe95c] border border-[#1a3300] px-2.5 py-0.5 rounded">
                HUB OVERVIEW
              </span>
              <span className="font-code text-xs text-[#767676]">
                • Warehouse Operational Dashboard
              </span>
            </div>
            <h1 className="font-display text-[36px] sm:text-[44px] text-[#1a3300] leading-none">
              INVENTORY MANAGEMENT
            </h1>
          </div>

          {/* Action Header Stack */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2 border border-[#1a3300] shadow-[3px_3px_0px_#ffe95c]"
            >
              <span className="text-lg font-bold">+</span>
              <span>Add New SKU</span>
            </button>
            <button
              onClick={() => {
                // Quick Stock Scan simulation
                if (items.length > 0) {
                  setAdjustingItem(items[0]);
                }
              }}
              className="btn-pastel-teal border border-[#1a3300] px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-[2px_2px_0px_#1a3300]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2 M17 3h2a2 2 0 0 1 2 2v2 M21 17v2a2 2 0 0 1-2 2h-2 M7 21H5a2 2 0 0 1-2-2v-2"></path>
              </svg>
              <span>Quick Audit Adjust</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Metric 1 */}
          <div className="surface-cream rounded-[14px] p-5 shadow-[4px_4px_0px_#1a3300]">
            <div className="flex justify-between items-start mb-2">
              <span className="font-code text-xs font-semibold text-[#767676] uppercase">
                ACTIVE MANAGED SKUS
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a3300]"></span>
            </div>
            <span className="font-display text-[38px] text-[#1a3300] block leading-none mb-1">
              {totalSkuCount}
            </span>
            <span className="font-body text-xs text-[#767676]">
              Across 3 connected warehouses
            </span>
          </div>

          {/* Metric 2 */}
          <div className="surface-blush rounded-[14px] p-5 shadow-[4px_4px_0px_#1a3300]">
            <div className="flex justify-between items-start mb-2">
              <span className="font-code text-xs font-bold text-[#1a3300] uppercase">
                LOW-STOCK WARNINGS
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#cb5521] animate-pulse"></span>
            </div>
            <span className="font-display text-[38px] text-[#1a3300] block leading-none mb-1">
              {lowStockCount}
            </span>
            <span className="font-body text-xs text-[#1a3300] font-semibold">
              Items below reorder point
            </span>
          </div>

          {/* Metric 3 */}
          <div className="surface-teal rounded-[14px] p-5 shadow-[4px_4px_0px_#1a3300]">
            <div className="flex justify-between items-start mb-2">
              <span className="font-code text-xs font-bold text-[#1a3300] uppercase">
                PENDING PO REORDERS
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a3300]"></span>
            </div>
            <span className="font-display text-[38px] text-[#1a3300] block leading-none mb-1">
              {reorderedCount}
            </span>
            <span className="font-body text-xs text-[#1a3300] font-medium">
              Supplier POs en route
            </span>
          </div>

          {/* Metric 4 */}
          <div className="surface-mint rounded-[14px] p-5 shadow-[4px_4px_0px_#1a3300]">
            <div className="flex justify-between items-start mb-2">
              <span className="font-code text-xs font-bold text-[#1a3300] uppercase">
                TOTAL STOCK VALUATION
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a3300]"></span>
            </div>
            <span className="font-display text-[34px] text-[#1a3300] block leading-none mb-1">
              ${totalValuation.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-body text-xs text-[#1a3300] font-medium">
              Real-time asset valuation
            </span>
          </div>
        </div>

        {/* Filter Toolbar Section */}
        <div className="bg-[#fcfaf5] border-2 border-[#1a3300] rounded-[14px] p-4 sm:p-5 mb-8 shadow-[5px_5px_0px_#1a3300]">
          <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#767676] pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU code, component name, supplier..."
                className="w-full pl-9 pr-4 py-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[8px] font-body text-sm text-[#1a3300] focus:outline-none focus:ring-2 focus:ring-[#ffe95c]"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-1">
                <label className="font-code text-xs text-[#767676] font-semibold">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] px-2.5 py-1.5 font-code text-xs font-semibold text-[#1a3300] focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Microcontrollers">Microcontrollers</option>
                  <option value="Passives">Passives</option>
                  <option value="Sensors">Sensors</option>
                  <option value="Power">Power</option>
                  <option value="Hardware">Hardware</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <label className="font-code text-xs text-[#767676] font-semibold">Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] px-2.5 py-1.5 font-code text-xs font-semibold text-[#1a3300] focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Reordered">Reordered</option>
                </select>
              </div>

              {/* Warehouse Filter */}
              <div className="flex items-center gap-1">
                <label className="font-code text-xs text-[#767676] font-semibold">Warehouse:</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] px-2.5 py-1.5 font-code text-xs font-semibold text-[#1a3300] focus:outline-none"
                >
                  <option value="All">All Warehouses</option>
                  <option value="Depot Alpha">Depot Alpha</option>
                  <option value="East Hub">East Hub</option>
                  <option value="Overflow West">Overflow West</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Inventory Table (Left) + Live Activity Feed (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inventory Table (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-[#1a3300]">
                SKU INVENTORY ITEMS ({filteredItems.length})
              </h2>
              <span className="font-code text-xs text-[#767676]">
                Click item '+' or '-' for instant count adjustment
              </span>
            </div>

            <div className="overflow-x-auto border-2 border-[#1a3300] rounded-[14px] bg-[#fcfaf5] shadow-[5px_5px_0px_#1a3300]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f1f1] border-b-2 border-[#1a3300] font-code text-xs text-[#1a3300]">
                    <th className="p-3.5 font-bold">SKU</th>
                    <th className="p-3.5 font-bold">ITEM NAME</th>
                    <th className="p-3.5 font-bold">BIN / LOCATION</th>
                    <th className="p-3.5 font-bold">STOCK</th>
                    <th className="p-3.5 font-bold">STATUS</th>
                    <th className="p-3.5 font-bold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b6b6b6]/40 font-body text-sm text-[#1a3300]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#767676] font-code">
                        No SKUs found matching your filter parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#f1f1f1]/50 transition-colors"
                      >
                        {/* SKU */}
                        <td className="p-3.5 font-code text-xs font-bold text-[#1a3300] whitespace-nowrap">
                          {item.sku}
                        </td>

                        {/* Name & Category */}
                        <td className="p-3.5">
                          <div className="font-semibold text-[14px] text-[#1a3300] leading-snug">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-code text-[10px] text-[#767676]">
                              {item.category}
                            </span>
                            <span className="font-code text-[10px] text-[#767676]">
                              • ${item.unitPrice.toFixed(2)}/ea
                            </span>
                          </div>
                        </td>

                        {/* Location & Warehouse */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-code text-xs bg-[#f1f1f1] border border-[#1a3300]/40 px-2 py-0.5 rounded font-medium">
                            {item.location}
                          </span>
                          <div className="font-code text-[10px] text-[#767676] mt-0.5">
                            {item.warehouse}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-code font-bold text-sm text-[#1a3300]">
                            {item.stock.toLocaleString()}
                          </div>
                          <div className="font-code text-[10px] text-[#767676]">
                            Min: {item.minReorder}
                          </div>
                        </td>

                        {/* Status Tag */}
                        <td className="p-3.5 whitespace-nowrap">
                          {item.status === "In Stock" && (
                            <span className="inline-flex items-center gap-1 bg-[#d5f5c2] border border-[#1a3300] px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#1a3300]">
                              In Stock
                            </span>
                          )}
                          {item.status === "Low Stock" && (
                            <span className="inline-flex items-center gap-1 bg-[#ffe95c] border border-[#1a3300] px-2.5 py-0.5 rounded-full text-xs font-bold text-[#1a3300] animate-pulse">
                              Low Stock
                            </span>
                          )}
                          {item.status === "Reordered" && (
                            <span className="inline-flex items-center gap-1 bg-[#f6d0ff] border border-[#1a3300] px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#1a3300]">
                              PO Sent
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setAdjustingItem(item)}
                            className="btn-outline px-2.5 py-1 text-xs font-semibold border border-[#1a3300]"
                          >
                            Adjust Qty
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Log Stream (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-[#1a3300]">
                STOCK LOG FEED
              </h2>
              <span className="font-code text-xs text-[#767676]">
                LIVE STREAM
              </span>
            </div>

            <div className="bg-[#fcfaf5] border-2 border-[#1a3300] rounded-[14px] p-4 shadow-[4px_4px_0px_#1a3300] space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 border border-[#1a3300] rounded-[8px] bg-[#fcfaf5] text-xs font-body space-y-1"
                >
                  <div className="flex items-center justify-between font-code text-[11px] text-[#767676]">
                    <span className="font-bold text-[#1a3300]">
                      {log.type === "in" && "🟢 CHECK-IN"}
                      {log.type === "out" && "🔴 DISPATCH"}
                      {log.type === "alert" && "⚠️ THRESHOLD ALERT"}
                      {log.type === "add" && "✨ NEW SKU"}
                    </span>
                    <span>{log.time}</span>
                  </div>
                  <p className="text-[#1a3300] font-medium leading-tight">
                    {log.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add SKU Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#1a3300]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfaf5] border-2 border-[#1a3300] rounded-[16px] max-w-lg w-full p-6 shadow-[8px_8px_0px_#1a3300] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1a3300] pb-3 mb-4">
              <h3 className="font-display text-2xl text-[#1a3300]">
                REGISTER NEW INVENTORY SKU
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[#1a3300] bg-[#f1f1f1] font-bold text-xs hover:bg-[#ffe95c]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSku} className="space-y-4 font-body text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RES-470-0805"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] font-code text-xs text-[#1a3300]"
                  />
                </div>
                <div>
                  <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] font-code text-xs text-[#1a3300]"
                  >
                    <option value="Microcontrollers">Microcontrollers</option>
                    <option value="Passives">Passives</option>
                    <option value="Sensors">Sensors</option>
                    <option value="Power">Power</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 470 Ohm 1/4W Metal Film Resistor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] text-sm text-[#1a3300]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] font-code text-xs"
                  />
                </div>
                <div>
                  <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    value={newMinReorder}
                    onChange={(e) => setNewMinReorder(Number(e.target.value))}
                    className="w-full p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] font-code text-xs"
                  />
                </div>
                <div>
                  <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] font-code text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                    Rack / Bin Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] font-code text-xs"
                  />
                </div>
                <div>
                  <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                    Target Depot
                  </label>
                  <select
                    value={newWarehouse}
                    onChange={(e) => setNewWarehouse(e.target.value as any)}
                    className="w-full p-2 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] font-code text-xs text-[#1a3300]"
                  >
                    <option value="Depot Alpha">Depot Alpha</option>
                    <option value="East Hub">East Hub</option>
                    <option value="Overflow West">Overflow West</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1a3300]/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-outline px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold shadow-[2px_2px_0px_#ffe95c]"
                >
                  Save &amp; Sync SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Quantity Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-[#1a3300]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfaf5] border-2 border-[#1a3300] rounded-[16px] max-w-md w-full p-6 shadow-[8px_8px_0px_#1a3300]">
            <div className="flex items-center justify-between border-b border-[#1a3300] pb-3 mb-4">
              <div>
                <span className="font-code text-xs font-bold text-[#1a3300] bg-[#ffe95c] px-2 py-0.5 rounded border border-[#1a3300]">
                  {adjustingItem.sku}
                </span>
                <h3 className="font-display text-xl text-[#1a3300] mt-1">
                  STOCK QUANTITY AUDIT
                </h3>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="w-8 h-8 rounded-full border border-[#1a3300] bg-[#f1f1f1] font-bold text-xs hover:bg-[#ffe95c]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-body text-sm mb-6">
              <div className="bg-[#f1f1f1] p-3 border border-[#1a3300] rounded-[8px] font-code text-xs">
                <div>Current On-Hand: <strong className="text-base">{adjustingItem.stock}</strong> units</div>
                <div className="text-[#767676] mt-0.5">Location: {adjustingItem.location} ({adjustingItem.warehouse})</div>
              </div>

              <div>
                <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                  Transaction Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("add")}
                    className={`py-2 text-xs font-bold rounded-[6px] border border-[#1a3300] ${
                      adjustType === "add"
                        ? "bg-[#d5f5c2] text-[#1a3300]"
                        : "bg-[#fcfaf5] text-[#767676]"
                    }`}
                  >
                    + Check-in Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("deduct")}
                    className={`py-2 text-xs font-bold rounded-[6px] border border-[#1a3300] ${
                      adjustType === "deduct"
                        ? "bg-[#f6d0ff] text-[#1a3300]"
                        : "bg-[#fcfaf5] text-[#767676]"
                    }`}
                  >
                    - Dispatch / Deduct
                  </button>
                </div>
              </div>

              <div>
                <label className="font-code text-xs font-bold text-[#1a3300] block mb-1">
                  Quantity Units:
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#fcfaf5] border border-[#1a3300] rounded-[6px] font-code text-base font-bold text-[#1a3300]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1a3300]/20">
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="btn-outline px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyAdjustment}
                className="btn-primary px-5 py-2 text-xs font-semibold shadow-[2px_2px_0px_#ffe95c]"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
