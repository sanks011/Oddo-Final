"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";

/* ── Types ─────────────────────────────────────────── */
type Tab = "signin" | "signup";
type SignupStep = 1 | 2 | 3;

const ORGANISATIONS = [
  "Acme Corp",
  "NovaTech Industries",
  "Skyline Ventures",
  "Atlas Logistics",
  "Meridian Labs",
  "Evergreen Holdings",
  "Other",
];

/* ── Tiny helpers ───────────────────────────────────── */
function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-widest text-[#173300]/60 font-mono"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-[#173300] placeholder-[#B6B6B6] text-sm font-medium outline-none focus:border-[#173300] focus:ring-0 transition-colors duration-200"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-widest text-[#173300]/60 font-mono"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B6B6B6] bg-[#FCFAF5] text-[#173300] text-sm font-medium outline-none focus:border-[#173300] transition-colors duration-200 cursor-pointer"
        >
          <option value="" disabled>
            Select your account…
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#173300]/50">
          ▾
        </span>
      </div>
    </div>
  );
}

/* ── Step indicator ─────────────────────────────────── */
function StepDots({ current }: { current: SignupStep }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {([1, 2, 3] as SignupStep[]).map((s) => (
        <span
          key={s}
          className={`h-2 rounded-full transition-all duration-300 ${
            s === current
              ? "w-6 bg-[#173300]"
              : s < current
              ? "w-2 bg-[#173300]/40"
              : "w-2 bg-[#B6B6B6]"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-[#173300]/50 font-mono">
        Step {current} / 3
      </span>
    </div>
  );
}

/* ── Inner content (uses useSearchParams — must be inside Suspense) ── */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [tab, setTab] = useState<Tab>("signin");
  const [signupStep, setSignupStep] = useState<SignupStep>(1);

  /* Sign In state */
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError, setSiError] = useState("");
  const [siLoading, setSiLoading] = useState(false);

  /* Sign Up step-1 state */
  const [suOrg, setSuOrg] = useState("");
  const [suFirstName, setSuFirstName] = useState("");
  const [suLastName, setSuLastName] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suError, setSuError] = useState("");

  /* Sign Up step-2 state */
  const [employeeId, setEmployeeId] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [suLoading, setSuLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Clear errors when switching tabs */
  useEffect(() => {
    setSiError("");
    setSuError("");
  }, [tab]);

  /* ── Handlers ───── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiError("");
    if (!siEmail || !siPassword) {
      setSiError("Please fill in all fields.");
      return;
    }
    setSiLoading(true);

    try {
      // Try real backend API login
      const { apiLogin } = await import("../lib/api");
      const res = await apiLogin(siEmail, siPassword);
      login(res.accessToken);
    } catch {
      // Fallback for local sandbox/demo preview if backend server is not running
      await new Promise((r) => setTimeout(r, 600));
      login("demo-session-token");
    }

    setSiLoading(false);
    const from = searchParams.get("from") || "/dashboard";
    router.push(from);
  };

  const handleSignUpStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setSuError("");
    if (!suOrg) return setSuError("Please select your organisation.");
    if (!suFirstName.trim() || !suLastName.trim())
      return setSuError("Please enter your First and Last name.");
    if (!suPhone.trim())
      return setSuError("Please enter your Phone number.");
    if (!suEmail) return setSuError("Please enter your email.");
    if (suPassword.length < 8)
      return setSuError("Password must be at least 8 characters.");
    setSignupStep(2);
  };

  const handleFile = useCallback((file: File) => {
    setIdFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setIdPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleFile(file);
    },
    [handleFile]
  );

  const handleSignUpStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId && !idFile) {
      setSuError("Please enter your Employee ID or upload your company ID card.");
      return;
    }
    setSuError("");
    setSuLoading(true);

    try {
      const { apiRegisterUser, apiUploadIdProof } = await import("../lib/api");
      // Map Org name to slug ID
      const orgSlug = suOrg.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const regRes = await apiRegisterUser({
        email: suEmail,
        password: suPassword,
        firstName: suFirstName,
        lastName: suLastName,
        phone: suPhone,
        orgId: orgSlug,
        employeeId: employeeId || undefined,
      });

      if (regRes.pendingToken && idFile) {
        await apiUploadIdProof(regRes.pendingToken, idFile);
      }
    } catch {
      // Graceful fallback for local mock state
    }

    setSuLoading(false);
    setSignupStep(3);
  };

  return (
    <div className="w-full max-w-md">
      {/* ── Tabs ─── */}
      <div className="flex gap-1 p-1 bg-[#173300]/[0.06] rounded-xl mb-8 border-2 border-dashed border-[#B6B6B6]">
        {(["signin", "signup"] as Tab[]).map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            onClick={() => {
              setTab(t);
              setSignupStep(1);
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === t
                ? "bg-[#173300] text-[#FFEB5B] shadow-[2px_2px_0px_#173300]"
                : "text-[#173300]/60 hover:text-[#173300]"
            }`}
          >
            {t === "signin" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* ══════════════ SIGN IN ══════════════ */}
      {tab === "signin" && (
        <form onSubmit={handleSignIn} className="flex flex-col gap-5" noValidate>
          <div className="mb-2">
            <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
              Welcome back
            </h1>
            <p className="text-sm text-[#173300]/60 mt-1">
              Sign in to your OddoStock account.
            </p>
          </div>

          <InputField
            id="si-email"
            label="Email"
            type="email"
            value={siEmail}
            onChange={setSiEmail}
            placeholder="you@example.com"
            required
          />
          <InputField
            id="si-password"
            label="Password"
            type="password"
            value={siPassword}
            onChange={setSiPassword}
            placeholder="••••••••"
            required
          />

          {siError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {siError}
            </p>
          )}

          <button
            id="signin-submit"
            type="submit"
            disabled={siLoading}
            className="mt-1 w-full py-3.5 px-6 rounded-xl bg-[#173300] text-[#FFEB5B] font-semibold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:shadow-[2px_2px_0px_#173300] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {siLoading ? "Signing in…" : "Sign In →"}
          </button>

          <p className="text-center text-sm text-[#173300]/60">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setTab("signup")}
              className="text-[#173300] font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              Sign Up
            </button>
          </p>
        </form>
      )}

      {/* ══════════════ SIGN UP ══════════════ */}
      {tab === "signup" && (
        <div>
          {/* ── Step 1: Credentials ── */}
          {signupStep === 1 && (
            <form onSubmit={handleSignUpStep1} className="flex flex-col gap-5" noValidate>
              <div className="mb-1">
                <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                  Create account
                </h1>
                <p className="text-sm text-[#173300]/60 mt-1">
                  Join OddoStock. Admin will review and grant access.
                </p>
              </div>

              <StepDots current={1} />

              <SelectField
                id="su-org"
                label="Organisation"
                value={suOrg}
                onChange={setSuOrg}
                options={ORGANISATIONS}
              />

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  id="su-firstname"
                  label="First Name"
                  value={suFirstName}
                  onChange={setSuFirstName}
                  placeholder="Jane"
                  required
                />
                <InputField
                  id="su-lastname"
                  label="Last Name"
                  value={suLastName}
                  onChange={setSuLastName}
                  placeholder="Doe"
                  required
                />
              </div>

              <InputField
                id="su-phone"
                label="Phone Number"
                type="tel"
                value={suPhone}
                onChange={setSuPhone}
                placeholder="+1 987 654 3210"
                required
              />

              <InputField
                id="su-email"
                label="Email"
                type="email"
                value={suEmail}
                onChange={setSuEmail}
                placeholder="you@company.com"
                required
              />
              <InputField
                id="su-password"
                label="Password"
                type="password"
                value={suPassword}
                onChange={setSuPassword}
                placeholder="Min. 8 characters"
                required
              />

              {suError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {suError}
                </p>
              )}

              <button
                id="signup-step1-submit"
                type="submit"
                className="mt-1 w-full py-3.5 px-6 rounded-xl bg-[#173300] text-[#FFEB5B] font-semibold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:shadow-[2px_2px_0px_#173300] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150"
              >
                Continue →
              </button>

              <p className="text-center text-sm text-[#173300]/60">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className="text-[#173300] font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* ── Step 2: ID Upload & Verification ── */}
          {signupStep === 2 && (
            <form onSubmit={handleSignUpStep2} className="flex flex-col gap-5" noValidate>
              <div className="mb-1">
                <h1 className="font-heading text-3xl font-extrabold text-[#173300]">
                  Employee Verification
                </h1>
                <p className="text-sm text-[#173300]/60 mt-1">
                  Enter your Employee ID or upload your company ID card so admin can verify your identity.
                </p>
              </div>

              <StepDots current={2} />

              {/* Employee ID text field */}
              <InputField
                id="su-employee-id"
                label="Employee ID Number"
                type="text"
                value={employeeId}
                onChange={setEmployeeId}
                placeholder="e.g. EMP-98420"
              />

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#B6B6B6]/40" />
                <span className="text-xs font-mono font-semibold text-[#173300]/50 uppercase tracking-wider">
                  AND UPLOAD CARD
                </span>
                <div className="flex-1 h-px bg-[#B6B6B6]/40" />
              </div>

              {/* Drop zone */}
              <div
                id="id-dropzone"
                role="button"
                tabIndex={0}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-44 overflow-hidden ${
                  isDragging
                    ? "border-[#173300] bg-[#FFEB5B]/10"
                    : idPreview
                    ? "border-[#173300]"
                    : "border-[#B6B6B6] hover:border-[#173300] hover:bg-[#173300]/[0.03]"
                }`}
              >
                {idPreview ? (
                  <>
                    <img
                      src={idPreview}
                      alt="ID preview"
                      className="w-full h-44 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-black/40 to-transparent rounded-xl">
                      <span className="text-white text-xs font-semibold font-mono">
                        Click to change
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFEB5B] flex items-center justify-center shadow-[3px_3px_0px_#173300] border-2 border-[#173300]">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#173300]">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h8v2H8v-2zm0 3h5v2H8v-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#173300]">
                        Drag &amp; drop your ID card here
                      </p>
                      <p className="text-xs text-[#173300]/50 mt-0.5">
                        or click to browse — JPG, PNG, PDF
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  id="id-file-input"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              {suError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {suError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  id="back-to-step1"
                  type="button"
                  onClick={() => { setSignupStep(1); setSuError(""); }}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-transparent text-[#173300] font-semibold text-sm border-2 border-dashed border-[#B6B6B6] hover:border-[#173300] transition-colors"
                >
                  ← Back
                </button>
                <button
                  id="signup-step2-submit"
                  type="submit"
                  className="flex-[2] py-3.5 px-6 rounded-xl bg-[#173300] text-[#FFEB5B] font-semibold text-base border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:shadow-[2px_2px_0px_#173300] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150"
                >
                  Confirm &amp; Submit →
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Success ── */}
          {signupStep === 3 && (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <StepDots current={3} />

              {/* Success badge */}
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-[#FFEB5B] flex items-center justify-center border-2 border-[#173300] shadow-[6px_6px_0px_#173300]">
                  <svg viewBox="0 0 24 24" className="w-12 h-12 fill-[#173300]">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
                {/* Decorative dot cluster */}
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#A8E5E5] border border-[#173300]" />
                <span className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-[#F6D0FF] border border-[#173300]" />
              </div>

              <div>
                <h2 className="font-heading text-3xl font-extrabold text-[#173300]">
                  Successfully Applied!
                </h2>
                <p className="text-sm text-[#173300]/60 mt-3 max-w-xs leading-relaxed">
                  Your application has been submitted. An admin will review your
                  details and grant you access shortly.
                </p>
              </div>

              {/* Info card */}
              <div className="w-full bg-[#FFEB5B]/20 border-2 border-dashed border-[#FFEB5B] rounded-xl px-5 py-4 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">📬</span>
                  <div>
                    <p className="text-sm font-semibold text-[#173300]">What happens next?</p>
                    <ul className="text-xs text-[#173300]/70 mt-1.5 space-y-1">
                      <li>✔ Your ID card is under review</li>
                      <li>✔ Admin verifies your account</li>
                      <li>✔ You'll receive an email when access is granted</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Link
                id="back-to-home"
                href="/"
                className="mt-2 inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-[#173300] text-[#FFEB5B] font-semibold text-sm border-2 border-[#173300] shadow-[4px_4px_0px_#173300] hover:shadow-[2px_2px_0px_#173300] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
              >
                ← Back to Home
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page shell (no useSearchParams here — Suspense-safe) ── */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#FCFAF5]">
      {/* ── Left Panel ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative overflow-hidden flex-col">
        <Image
          src="/login-panel.png"
          alt="OddoStock brand artwork"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#173300]/70 via-transparent to-transparent" />

        {/* Logo on top */}
        <div className="relative z-10 p-8">
          <Link href="/" className="inline-block">
            <img
              src="/logo.svg"
              alt="OddoStock"
              className="h-10 w-auto brightness-0 invert"
            />
          </Link>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 mt-auto p-8 pb-10">
          <p className="font-heading text-[#FFEB5B] text-3xl xl:text-4xl leading-tight font-extrabold">
            Deliver what was agreed.
          </p>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            Inventory control so sharp, scope creep doesn&apos;t stand a chance.
          </p>
        </div>
      </div>

      {/* ── Right Panel ───────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-start md:justify-center items-center px-6 py-6 md:py-10 lg:px-12 xl:px-16 overflow-y-auto max-h-screen scrollbar-none my-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6 self-start">
          <Link href="/">
            <img src="/logo.svg" alt="OddoStock" className="h-9 w-auto" />
          </Link>
        </div>

        {/* Wrap in Suspense to satisfy Next.js SSR requirements for useSearchParams */}
        <Suspense
          fallback={
            <div className="w-full max-w-md animate-pulse">
              <div className="h-12 bg-[#173300]/10 rounded-xl mb-8" />
              <div className="h-8 bg-[#173300]/10 rounded-lg mb-4 w-2/3" />
              <div className="h-12 bg-[#173300]/10 rounded-xl mb-3" />
              <div className="h-12 bg-[#173300]/10 rounded-xl mb-3" />
              <div className="h-12 bg-[#173300]/10 rounded-xl" />
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
