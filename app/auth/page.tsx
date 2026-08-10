"use client";

import { useState, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Direct DOM references for form fields (NO React state for input values)
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Direct DOM access for field values
    const email = emailRef.current?.value?.trim() || "";
    const password = passwordRef.current?.value || "";
    const name = nameRef.current?.value?.trim() || email.split("@")[0] || "User";

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    // Get existing accounts from localStorage
    let accounts: Array<{ email: string; password?: string; name: string; plan: string }> = [];
    try {
      const stored = localStorage.getItem("xts_accounts");
      if (stored) accounts = JSON.parse(stored);
    } catch {
      accounts = [];
    }

    if (tab === "signin") {
      // Find matching account if accounts exist
      const existingAccount = accounts.find(
        (acc) => acc.email.toLowerCase() === email.toLowerCase()
      );

      if (existingAccount) {
        if (existingAccount.password && existingAccount.password !== password) {
          setError("Incorrect password. Please try again.");
          return;
        }
      } else {
        // Demo mode: if no account stored yet, save account on initial sign-in
        accounts.push({ email, password, name, plan: "free" });
        localStorage.setItem("xts_accounts", JSON.stringify(accounts));
      }

      const userData = {
        email,
        name: existingAccount?.name || name,
        plan: "free",
      };

      // Store in localStorage & Cookie
      localStorage.setItem("xts_user", JSON.stringify(userData));
      document.cookie = `xts_user=${encodeURIComponent(
        JSON.stringify(userData)
      )}; path=/; max-age=2592000; SameSite=Lax`;

      setSuccess("Sign in successful! Redirecting...");
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 500);
    } else {
      // Sign Up Tab
      const existingAccount = accounts.find(
        (acc) => acc.email.toLowerCase() === email.toLowerCase()
      );

      if (existingAccount) {
        setError("An account with this email already exists. Please sign in.");
        return;
      }

      const newAccount = { email, password, name, plan: "free" };
      accounts.push(newAccount);
      localStorage.setItem("xts_accounts", JSON.stringify(accounts));

      const userData = { email, name, plan: "free" };
      localStorage.setItem("xts_user", JSON.stringify(userData));
      document.cookie = `xts_user=${encodeURIComponent(
        JSON.stringify(userData)
      )}; path=/; max-age=2592000; SameSite=Lax`;

      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      {/* Navigation header */}
      <nav className="border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-black text-xl tracking-tight text-black flex items-center gap-2">
          ⚡ XTREME SCRAPER
        </Link>
        <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-black">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50/50">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-black text-2xl tracking-tight mb-2">
              Xtreme Scraper — Sign In
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Access intelligence search, saved leads & outreach tools
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                tab === "signin"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                tab === "signup"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error / Success messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
              {success}
            </div>
          )}

          {/* Form with Direct DOM Access Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Full Name
                </label>
                <input
                  ref={nameRef}
                  id="auth-name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-yellow-400 font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Email Address
              </label>
              <input
                ref={emailRef}
                id="auth-email"
                type="email"
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-yellow-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Password
              </label>
              <input
                ref={passwordRef}
                id="auth-password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-yellow-400 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl font-extrabold text-base text-black transition-all shadow-md hover:brightness-95 mt-2"
              style={{ backgroundColor: "#FFBE00" }}
            >
              {tab === "signin" ? "Sign In →" : "Create Free Account →"}
            </button>
          </form>

          {/* Demo account notice */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-medium">
              Demo Auth Layer · Credentials stored in local browser session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
