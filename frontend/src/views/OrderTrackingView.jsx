import React, { useState, useEffect } from "react";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  XCircle,
  RefreshCw,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Key,
} from "lucide-react";
import { orderApi, paymentApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import OrderStepper from "../components/OrderStepper";

export default function OrderTrackingView({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { addToast } = useToast();

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getById(orderId);
      if (res.success) {
        setOrder(res.order);
      }
    } catch (err) {
      addToast(err.message || "Failed to load order", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? Reserved stock will be returned to catalog.")) {
      return;
    }
    setCancelling(true);
    try {
      const res = await orderApi.cancel(orderId, "Customer cancellation");
      if (res.success) {
        addToast(res.message, "success");
        setOrder(res.order);
      }
    } catch (err) {
      addToast(err.message || "Failed to cancel order", "error");
    } finally {
      setCancelling(false);
    }
  };

  const handleRetryPayment = async (outcome) => {
    setRetrying(true);
    try {
      const res = await paymentApi.process(
        {
          orderId: order._id,
          paymentMethod: "card",
          simulateOutcome: outcome,
        },
        `retry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      );

      addToast(res.message || "Payment processed", res.success ? "success" : "error");
      await fetchOrder();
    } catch (err) {
      addToast(err.message || "Payment retry failed", "error");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading order tracking information...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <h3>Order not found</h3>
        <button onClick={onBack} className="btn-secondary" style={{ marginTop: "1rem" }}>
          <ArrowLeft size={16} /> Back to Orders
        </button>
      </div>
    );
  }

  const canCancel =
    order.status === "PENDING" ||
    order.status === "PAYMENT_PROCESSING" ||
    order.status === "PAID";

  const canRetryPayment =
    order.status === "PENDING" ||
    order.status === "PAYMENT_FAILED" ||
    order.paymentStatus === "FAILED" ||
    order.paymentStatus === "TIMEOUT";

  return (
    <div className="container animate-fade" style={{ padding: "3rem 1.5rem" }}>
      <button
        onClick={onBack}
        className="btn-secondary"
        style={{ marginBottom: "1.75rem", fontSize: "0.85rem" }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "1.75rem",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Order #{order._id.slice(-8)}</h1>
            <span
              className={`badge ${
                order.status === "PAID" || order.status === "DELIVERED"
                  ? "badge-paid"
                  : order.status === "PAYMENT_FAILED"
                  ? "badge-failed"
                  : order.status === "CANCELLED"
                  ? "badge-cancelled"
                  : "badge-pending"
              }`}
            >
              {order.status}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Calendar size={14} /> Placed on {new Date(order.createdAt).toLocaleString()}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Key size={14} color="#ec4899" /> Idempotency: {order.idempotencyKey}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {canCancel && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="btn-danger"
              style={{ fontSize: "0.85rem" }}
            >
              <XCircle size={16} /> {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}

          <button onClick={fetchOrder} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
            <RefreshCw size={15} /> Refresh State
          </button>
        </div>
      </div>

      {/* Order State Machine Tracker */}
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Order Lifecycle State Machine (Requirement 6)
        </h3>
        <OrderStepper status={order.status} />

        {/* Retry Payment Box if declined or timed out */}
        {canRetryPayment && (
          <div
            style={{
              marginTop: "2rem",
              padding: "1.25rem",
              borderRadius: "var(--radius-sm)",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            <h4 style={{ color: "#fbbf24", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              Action Required: Payment Not Completed
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Retry payment simulation now to advance order to <strong>PAID</strong> state:
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => handleRetryPayment("SUCCESS")}
                disabled={retrying}
                className="btn-primary"
                style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
              >
                Simulate Successful Payment
              </button>
              <button
                onClick={() => handleRetryPayment("FAILED")}
                disabled={retrying}
                className="btn-secondary"
                style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", color: "#f87171" }}
              >
                Simulate Decline
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Grid: Items and Shipping */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Left: Items */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            Ordered Items ({order.items.length})
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  paddingBottom: "0.75rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#ffffff" }}>{item.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    SKU: {item.sku} • Qty: {item.quantity} × ₹{item.unitPrice}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  ₹{item.lineTotal}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Subtotal:</span>
              <span>₹{order.subtotal}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399" }}>
                <span>Discount:</span>
                <span>- ₹{order.discount}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Tax (5%):</span>
              <span>₹{order.tax}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Shipping:</span>
              <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
            </div>
            <div
              style={{
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "0.75rem",
                marginTop: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              <span>Total:</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Right: Shipping & Payment Meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Shipping Address */}
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <MapPin size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Delivery Address</h3>
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, color: "#ffffff" }}>{order.shippingAddress?.name}</div>
              <div>{order.shippingAddress?.phone}</div>
              <div>{order.shippingAddress?.addressLine}</div>
              <div>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                {order.shippingAddress?.postalCode}
              </div>
              <div>{order.shippingAddress?.country}</div>
            </div>
          </div>

          {/* Payment Status Metadata */}
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <CreditCard size={18} color="#10b981" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Payment Record</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Payment Status:</span>
                <span style={{ fontWeight: 700, color: order.paymentStatus === "SUCCESS" ? "#34d399" : "#fbbf24" }}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.paidAt && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Paid At:</span>
                  <span>{new Date(order.paidAt).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Idempotent Reference:</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  {order.idempotencyKey}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
