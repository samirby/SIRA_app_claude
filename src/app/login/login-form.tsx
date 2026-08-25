"use client";

import { FormEvent, useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, remember }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error?.message || "Login-i dështoi.");
      window.location.assign(result.data?.redirectTo || "/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login-i dështoi.");
    } finally { setLoading(false); }
  }

  return <form className="loginForm" onSubmit={submit}>
    {error && <div className="loginError">{error}</div>}
    <label><span>Email</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@sira.at" /></label>
    <label><span>Password</span><div className="loginPassword"><input type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password-i" /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Fshih" : "Shfaq"}</button></div></label>
    <div className="loginOptions"><label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Më mbaj të kyçur</span></label><span>Vetëm administrator</span></div>
    <button className="loginSubmit" disabled={loading}>{loading ? "Duke u kyçur..." : "Kyçu"}</button>
  </form>;
}
