"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/crypto";

function isValidEmail(emailStr: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailStr);
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");

  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [generalError, setGeneralError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const resetErrors = () => {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
    setSuccess("");
  };

  const handleTabChange = (newTab: "signin" | "signup") => {
    setTab(newTab);
    resetErrors();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    resetErrors();

    const cleanEmail = email.trim();
    const cleanPassword = password;
    const cleanName = name.trim() || cleanEmail.split("@")[0] || "User";

    let hasError = false;

    if (!cleanEmail) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!isValidEmail(cleanEmail)) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    }

    if (!cleanPassword) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (cleanPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      const accounts: { email: string; password: string; name: string }[] = JSON.parse(
        localStorage.getItem("xts_accounts") || "[]"
      );

      if (tab === "signup") {
        const existing = accounts.find(
          (a) => a.email.toLowerCase() === cleanEmail.toLowerCase()
        );
        if (existing) {
          setGeneralError("Account already exists. Sign in instead.");
          setIsSubmitting(false);
          return;
        }

        const hashedPassword = await hashPassword(cleanPassword);
        accounts.push({ email: cleanEmail, password: hashedPassword, name: cleanName });
        localStorage.setItem("xts_accounts", JSON.stringify(accounts));

        const user = { email: cleanEmail, name: cleanName, plan: "free" };
        localStorage.setItem("xts_user", JSON.stringify(user));
        document.cookie = `xts_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800`;

        setSuccess("Account created! Redirecting...");
        setTimeout(() => router.push(redirectTarget), 800);
      } else {
        const accountIndex = accounts.findIndex(
          (a) => a.email.toLowerCase() === cleanEmail.toLowerCase()
        );

        if (accountIndex === -1) {
          setGeneralError("Invalid email or password.");
          setIsSubmitting(false);
          return;
        }

        const account = accounts[accountIndex];
        const isMatch = await verifyPassword(cleanPassword, account.password);

        if (!isMatch) {
          setGeneralError("Invalid email or password.");
          setIsSubmitting(false);
          return;
        }

        // Migration: on first login, if stored account has a plain-text password (no 'sha256:' prefix),
        // hash it and update localStorage automatically
        if (!account.password.startsWith("sha256:")) {
          const hashedPassword = await hashPassword(cleanPassword);
          accounts[accountIndex].password = hashedPassword;
          localStorage.setItem("xts_accounts", JSON.stringify(accounts));
        }

        const user = { email: account.email, name: account.name, plan: "free" };
        localStorage.setItem("xts_user", JSON.stringify(user));
        document.cookie = `xts_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800`;

        router.push(redirectTarget);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setGeneralError("An unexpected error occurred during authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#999",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Xtreme Scraper
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>
            {tab === "signin" ? "Sign In" : "Create Account"}
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid #e5e5e5",
            marginBottom: 28,
          }}
        >
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              style={{
                flex: 1,
                padding: "12px 0",
                background: tab === t ? "#111" : "#fff",
                color: tab === t ? "#fff" : "#555",
                border: "none",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
                if (generalError) setGeneralError("");
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1px solid ${emailError ? "#dc2626" : "#ddd"}`,
                borderRadius: 8,
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {emailError && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                  if (generalError) setGeneralError("");
                }}
                style={{
                  width: "100%",
                  padding: "12px 54px 12px 14px",
                  border: `1px solid ${passwordError ? "#dc2626" : "#ddd"}`,
                  borderRadius: 8,
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#555",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 6px",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {passwordError && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                {passwordError}
              </p>
            )}
          </div>

          {generalError && <p style={{ color: "#dc2626", fontSize: 14, margin: 0 }}>{generalError}</p>}
          {success && <p style={{ color: "#16a34a", fontSize: 14, margin: 0 }}>{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "13px 0",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {isSubmitting ? "Processing..." : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#999" }}>
          {tab === "signin" ? "No account? " : "Already have one? "}
          <button
            onClick={() => handleTabChange(tab === "signin" ? "signup" : "signin")}
            style={{
              background: "none",
              border: "none",
              color: "#111",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              textDecoration: "underline",
            }}
          >
            {tab === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link href="/dashboard" style={{ color: "#bbb", fontSize: 13, textDecoration: "none" }}>
            Continue without account →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Loading...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
