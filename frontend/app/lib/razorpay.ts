"use client";

/**
 * Razorpay Checkout SDK helper for Next.js carpooling app.
 * Dynamically loads Razorpay JS script and manages checkout modal.
 */

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: "upi" | "card" | "netbanking" | "wallet";
  };
  config?: {
    display?: {
      blocks?: Record<string, any>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export async function openRazorpayCheckout(
  options: RazorpayOptions,
  onSimulatedFallback?: () => Promise<void>
) {
  const isPlaceholder = !options.key || options.key.startsWith("rzp_test_placeholder");

  if (!isPlaceholder) {
    const loaded = await loadRazorpayScript();
    if (loaded && (window as any).Razorpay) {
      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn("[Razorpay] Failed to open checkout SDK, falling back:", err);
      }
    }
  }

  // Fallback mode for placeholder test keys or if SDK script is blocked
  if (onSimulatedFallback) {
    await onSimulatedFallback();
  }
}
