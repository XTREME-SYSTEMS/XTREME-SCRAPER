"use client";

import { useState, useRef, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const email = emailRef.current?.value?.trim() || "";
    const password = passwordRef.current?.value || "";
    const name = nameRef.current?.value?.trim() || email.split("@")[0] || "User";

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (tab === "signup") {
      const accounts: { email: string; password: string; name: string }[] = JSON.parse(
        localStorage.getItem("xts_accounts") || "[]"
      );
      if (accounts.find((a) => a.email === email)) {
        setError("Account already exists. Sign in instead.");
        return;
      }
      accounts.push({ email, password, name });
      localStorage.setItem("xts_accounts", JSON.stringify(accounts));
      const user = { email, name, plan: "free" };
      localStorage.setItem("xts_user", JSON.stringify(user));
      document.cookie = `xts_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `xts_session=1; path=/; max-age=604800; SameSite=Lax`;
      setSuccess("Account created! Redirecting...");
      setTimeout(() => router.push(redirectTarget), 800);
    } else {
      const accounts: { email: string; password: string; name: string }[] = JSON.parse(
        localStorage.getItem("xts_accounts") || "[]"
      );
      const match = accounts.find((a) => a.email === email && a.password === password);
      if (!match) {
        setError("Invalid email or password.");
        return;
      }
      const user = { email: match.email, name: match.name, plan: "free" };
      localStorage.setItem("xts_user", JSON.stringify(user));
      document.cookie = `xts_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `xts_session=1; path=/; max-age=604800; SameSite=Lax`;
      router.push(redirectTarget);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#999", textTransform: "uppercase", marginBottom: 8 }}>Xtreme Scraper</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111", margin: 0 }}>
            {tab === "signin" ? "Sign In" : "Create Account"}
          </h1>
        </div>

        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid #e5e5e5", marginBottom: 28 }}>
          {(["signin", "signup"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
              style={{ flex: 1, padding: "12px 0", background: tab === t ? "#111" : "#fff", color: tab === t ? "#fff" : "#555", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "signup" && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Full Name</label>
              <input ref={nameRef} type="text" placeholder="Your name" defaultValue=""
                style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Email</label>
            <input ref={emailRef} type="email" placeholder="you@company.com" defaultValue=""
              style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6 }}>Password</label>
            <input ref={passwordRef} type="password" placeholder="••••••••" defaultValue=""
              style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 14, margin: 0 }}>{error}</p>}
          {success && <p style={{ color: "#16a34a", fontSize: 14, margin: 0 }}>{success}</p>}

          <button type="submit"
            style={{ padding: "13px 0", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>
            {tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#999" }}>
          {tab === "signin" ? "No account? " : "Already have one? "}
          <button onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
            style={{ background: "none", border: "none", color: "#111", fontWeight: 600, cursor: "pointer", fontSize: 14, textDecoration: "underline" }}>
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
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
