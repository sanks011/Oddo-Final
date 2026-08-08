"use client";

import { useState, useEffect, useRef } from "react";

interface LocationInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  showAutoDetect?: boolean;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export default function LocationInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter location…",
  required = false,
  showAutoDetect = false,
}: LocationInputProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectedRef = useRef<boolean>(false);

  // Debounced Ola Maps Autocomplete search
  useEffect(() => {
    // If the value update was caused by selecting a suggestion, don't fetch or re-open
    if (isSelectedRef.current) {
      setIsOpen(false);
      return;
    }

    if (!value || value.trim().length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Re-check in case user selected while timer was pending
      if (isSelectedRef.current) return;

      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          if (!isSelectedRef.current && data.predictions && data.predictions.length > 0) {
            setPredictions(data.predictions);
            setIsOpen(true);
          } else {
            setPredictions([]);
            setIsOpen(false);
          }
        }
      } catch {
        setPredictions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectOption = (desc: string) => {
    isSelectedRef.current = true;
    setIsOpen(false);
    setPredictions([]);
    onChange(desc);
  };

  const handleUserInputChange = (text: string) => {
    isSelectedRef.current = false;
    onChange(text);
  };

  // Automatic GPS Location Detection via Browser Geolocation API & Ola Reverse Geocode
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetecting(true);
    isSelectedRef.current = true;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/places/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data.formatted_address) {
              onChange(data.formatted_address);
            } else {
              onChange(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            }
          }
        } catch {
          onChange(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        }
        setIsDetecting(false);
        setIsOpen(false);
      },
      () => {
        // Fallback default position (e.g. Iskcon Cross Road, SG Highway) if denied or blocked
        onChange("Iskcon Cross Road, SG Highway, Ahmedabad");
        setIsDetecting(false);
        setIsOpen(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative w-full">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs font-mono font-bold uppercase text-[#173300]">
          {label}
        </label>
        {showAutoDetect && (
          <button
            type="button"
            onClick={handleAutoDetectLocation}
            disabled={isDetecting}
            className="text-[11px] font-mono font-bold text-[#173300] hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <span>{isDetecting ? "Detecting GPS…" : "Auto-Detect My Location"}</span>
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <svg className="w-5 h-5 absolute left-3.5 text-[#173300]/60 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => handleUserInputChange(e.target.value)}
          onFocus={() => {
            if (!isSelectedRef.current && predictions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          className="w-full pl-11 pr-10 py-3 rounded-xl border-b-2 border-t-0 border-x-0 border-[#173300] bg-[#FCFAF5] text-sm font-semibold text-[#173300] outline-none focus:border-b-4 transition-all"
        />
      </div>

      {/* Ola Maps Autocomplete Dropdown List */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#FCFAF5] border-2 border-[#173300] rounded-2xl shadow-[6px_6px_0px_#173300] z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-[#B6B6B6]/40">
          {predictions.map((p, idx) => {
            const mainText = p.structured_formatting?.main_text || p.description.split(",")[0];
            const secText = p.structured_formatting?.secondary_text || p.description.split(",").slice(1).join(",");
            return (
              <button
                key={`${p.place_id || p.description}-${idx}`}
                type="button"
                onClick={() => handleSelectOption(p.description)}
                className="w-full text-left p-3 hover:bg-[#FFEB5B]/40 transition-colors flex flex-col gap-0.5 font-mono text-xs"
              >
                <span className="font-bold text-[#173300] text-sm leading-snug">
                  {mainText}
                </span>
                {secText && (
                  <span className="text-[#173300]/60 text-[11px] truncate">
                    {secText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
