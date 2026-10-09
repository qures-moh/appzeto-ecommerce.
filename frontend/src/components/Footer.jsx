import React from "react";
import { CheckCircle2, Shield, RefreshCw, Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "5rem",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
        padding: "3.5rem 0 2rem",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <Cpu size={18} color="var(--accent-primary)" />
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Atomic Concurrency
              </h4>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Strict conditional decrements (<code>$gte</code> filter + <code>$inc</code>) guarantee zero overselling even under 100+ parallel requests.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <Shield size={18} color="#059669" />
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Order State Machine
              </h4>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Deterministic transitions: PENDING → PAYMENT_PROCESSING → PAID → PROCESSING → SHIPPED → DELIVERED with invalid state rejection.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <CheckCircle2 size={18} color="var(--accent-primary)" />
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Idempotency Engine
              </h4>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              <code>Idempotency-Key</code> header prevents duplicate checkouts and duplicate payment gateway transactions on retries or drops.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <RefreshCw size={18} color="#d97706" />
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Background Workers
              </h4>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Automated reservation release after expiration TTL, stock rollback compensation, and mock payment webhook idempotency.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
          }}
        >
          <div>
            Appzeto Machine Test • Task 3 E-Commerce System
          </div>
          <div>High-Performance Order Processing & Inventory Platform</div>
        </div>
      </div>
    </footer>
  );
}
