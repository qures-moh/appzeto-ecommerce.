import React, { useState } from "react";
import { User, Lock, Mail, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthView({ onSuccess }) {
  const { login, register, loginAsPreset } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let ok = false;
    if (isRegister) {
      const res = await register(name, email, password);
      ok = res.success;
    } else {
      const res = await login(email, password);
      ok = res.success;
    }
    setSubmitting(false);
    if (ok && onSuccess) onSuccess();
  };

  const handleQuickCustomer = async () => {
    setSubmitting(true);
    const res = await loginAsPreset("user");
    setSubmitting(false);
    if (res?.success && onSuccess) onSuccess();
  };

  return (
    <div
      className="container animate-fade"
      style={{
        padding: "4rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "2.75rem 2.25rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--accent-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "var(--accent-primary)",
            }}
          >
            <User size={24} />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.85rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {isRegister ? "Join Appzeto" : "Welcome Back"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
            {isRegister
              ? "Create your personal account to order curated looks"
              : "Sign in to track orders & manage your delivery addresses"}
          </p>
        </div>

        {/* Quick Demo Login Pill */}
        <div
          style={{
            padding: "0.85rem",
            borderRadius: "var(--radius-sm)",
            background: "var(--accent-light)",
            border: "1px solid #fed7aa",
            marginBottom: "1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700, marginBottom: "0.4rem" }}>
            FAST DEMO ACCESS:
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleQuickCustomer}
            className="btn-secondary"
            style={{
              width: "100%",
              fontSize: "0.8rem",
              padding: "0.45rem",
              borderRadius: "var(--radius-sm)",
              justifyContent: "center",
              background: "#ffffff",
              color: "var(--text-primary)",
            }}
          >
            <Sparkles size={14} color="var(--accent-primary)" />
            One-Click Customer Login (user@appzeto.com)
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-full)",
            padding: "4px",
            marginBottom: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: !isRegister ? "#ffffff" : "transparent",
              color: !isRegister ? "var(--accent-primary)" : "var(--text-secondary)",
              boxShadow: !isRegister ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.2s",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: isRegister ? "#ffffff" : "transparent",
              color: isRegister ? "var(--accent-primary)" : "var(--text-secondary)",
              boxShadow: isRegister ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.2s",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: "2.3rem" }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "2.3rem" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Password (min 8 characters)
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "2.3rem" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: "100%", padding: "0.85rem", marginTop: "0.5rem" }}
          >
            {submitting ? "Processing..." : isRegister ? "Create Free Account" : "Sign In to Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
