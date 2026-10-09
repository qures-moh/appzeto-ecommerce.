import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CreditCard,
  MapPin,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Key,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { orderApi, paymentApi } from "../lib/api";

export default function CheckoutView({ onBackToCart, onOrderSuccess }) {
  const { user } = useAuth();
  const { items, pricing, clearCart } = useCart();
  const { addToast } = useToast();

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || "John Doe",
    phone: user?.phone || "+91 9876543210",
    addressLine: "Flat 402, Highrise Heights, MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
  });

  const [simulateOutcome, setSimulateOutcome] = useState("SUCCESS");
  const [idempotencyKey, setIdempotencyKey] = useState(
    `idem_key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setShippingAddress({
        name: def.name || user.name,
        phone: def.phone || user.phone || "+91 9876543210",
        addressLine: def.addressLine || "",
        city: def.city || "",
        state: def.state || "",
        postalCode: def.postalCode || "",
        country: def.country || "India",
      });
    }
  }, [user]);

  const regenerateKey = () => {
    setIdempotencyKey(
      `idem_key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    );
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      addToast("Your cart is empty", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create Order with Idempotency Key
      const orderRes = await orderApi.create(
        { shippingAddress },
        idempotencyKey
      );

      if (!orderRes.success) {
        throw new Error(orderRes.message || "Failed to create order");
      }

      const createdOrder = orderRes.order;

      // Step 2: Trigger Payment Simulation
      const paymentRes = await paymentApi.process(
        {
          orderId: createdOrder._id,
          paymentMethod: "card",
          simulateOutcome,
        },
        `pay_${idempotencyKey}`
      );

      clearCart();

      if (simulateOutcome === "SUCCESS") {
        addToast("Order placed and payment confirmed!", "success");
      } else if (simulateOutcome === "FAILED") {
        addToast("Order created but payment was declined (Simulated)", "error");
      } else {
        addToast("Payment gateway timed out. Order is pending webhook confirmation.", "warning");
      }

      onOrderSuccess(createdOrder._id);
    } catch (err) {
      addToast(err.message || "Checkout failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade" style={{ padding: "3rem 1.5rem" }}>
      <button
        onClick={onBackToCart}
        className="btn-secondary"
        style={{ marginBottom: "1.75rem", fontSize: "0.85rem" }}
      >
        <ChevronLeft size={16} /> Back to Cart
      </button>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <CreditCard size={28} color="var(--accent-primary)" /> Secure Checkout
      </h1>

      <form onSubmit={handlePlaceOrder}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "2.5rem",
            alignItems: "start",
          }}
        >
          {/* Left Column: Shipping & Payment Simulation Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Shipping Address Panel */}
            <div className="glass-panel" style={{ padding: "1.75rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  marginBottom: "1.25rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "0.75rem",
                }}
              >
                <MapPin size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>1. Shipping Address</h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={shippingAddress.name}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={shippingAddress.addressLine}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, addressLine: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    State / Region
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, state: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={shippingAddress.country}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, country: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Payment Provider Simulator (Test requirement Section 7) */}
            <div className="glass-panel" style={{ padding: "1.75rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <CreditCard size={20} color="#10b981" />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>2. Payment Provider Simulator</h3>
                </div>
                <span className="badge badge-processing">Requirement 7</span>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Select mock payment outcome to test the system's order state transitions:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    padding: "0.85rem",
                    borderRadius: "var(--radius-sm)",
                    background:
                      simulateOutcome === "SUCCESS"
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(255, 255, 255, 0.03)",
                    border:
                      simulateOutcome === "SUCCESS"
                        ? "1px solid rgba(16, 185, 129, 0.4)"
                        : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="simulateOutcome"
                    value="SUCCESS"
                    checked={simulateOutcome === "SUCCESS"}
                    onChange={(e) => setSimulateOutcome(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                      SUCCESS Outcome (200 OK)
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#059669" }}>
                      Advances order state to <strong>PAID</strong>, triggers email worker, and reserves stock.
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    padding: "0.85rem",
                    borderRadius: "var(--radius-sm)",
                    background:
                      simulateOutcome === "FAILED"
                        ? "rgba(239, 68, 68, 0.08)"
                        : "var(--bg-secondary)",
                    border:
                      simulateOutcome === "FAILED"
                        ? "1px solid rgba(239, 68, 68, 0.3)"
                        : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="simulateOutcome"
                    value="FAILED"
                    checked={simulateOutcome === "FAILED"}
                    onChange={(e) => setSimulateOutcome(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                      FAILED Outcome (Card Decline)
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#dc2626" }}>
                      Transitions order to <strong>PAYMENT_FAILED</strong>, allowing retry or cancel.
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    padding: "0.85rem",
                    borderRadius: "var(--radius-sm)",
                    background:
                      simulateOutcome === "TIMEOUT"
                        ? "rgba(245, 158, 11, 0.08)"
                        : "var(--bg-secondary)",
                    border:
                      simulateOutcome === "TIMEOUT"
                        ? "1px solid rgba(245, 158, 11, 0.3)"
                        : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="simulateOutcome"
                    value="TIMEOUT"
                    checked={simulateOutcome === "TIMEOUT"}
                    onChange={(e) => setSimulateOutcome(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                      TIMEOUT Outcome (Gateway Unresponsive)
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#d97706" }}>
                      Order stays in <strong>PAYMENT_PROCESSING</strong> waiting for mock webhook resolution.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Idempotency Key Panel (Requirement 8) */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Key size={18} color="var(--accent-primary)" />
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Idempotency Protection (Requirement 8)</h4>
                </div>
                <button
                  type="button"
                  onClick={regenerateKey}
                  className="btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                  title="Generate a fresh idempotency key"
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Sent via <code>Idempotency-Key</code> HTTP header. Prevents duplicate checkouts on retry:
              </p>

              <input
                type="text"
                className="input-field"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="glass-panel" style={{ padding: "1.75rem", position: "sticky", top: "6rem" }}>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "1rem",
                marginBottom: "1.25rem",
                color: "var(--text-primary)",
              }}
            >
              Order Review
            </h3>

            {/* Items mini list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {items.map((it) => (
                <div
                  key={it._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {it.product?.name}
                    </span>
                    <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                      x{it.quantity}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    ₹{(it.product?.price || 0) * it.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Subtotal:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 700 }}>₹{pricing.subtotal}</span>
              </div>

              {pricing.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#047857" }}>
                  <span>Discount:</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>- ₹{pricing.discount}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Tax (5%):</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>₹{pricing.tax}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Shipping:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {pricing.shipping === 0 ? "FREE" : `₹${pricing.shipping}`}
                </span>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "1rem",
                  marginTop: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>Total Due:</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color: "var(--accent-primary)",
                  }}
                >
                  ₹{pricing.grandTotal}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="btn-primary"
              style={{ width: "100%", marginTop: "1.75rem", padding: "0.9rem" }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Reserving Inventory...
                </>
              ) : (
                <>
                  Confirm Order & Simulate Payment <ArrowRight size={18} />
                </>
              )}
            </button>

            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              <ShieldCheck size={16} color="#10b981" />
              <span>Zero-Oversell Guarantee: Inventory decremented conditionally in database.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
