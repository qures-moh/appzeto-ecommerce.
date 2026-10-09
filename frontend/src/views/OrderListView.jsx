import React, { useState, useEffect } from "react";
import { Package, Calendar, ArrowRight, Eye, RefreshCw } from "lucide-react";
import { orderApi } from "../lib/api";

export default function OrderListView({ onSelectOrder, onExploreCatalog }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="container animate-fade" style={{ padding: "3rem 1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Package size={28} color="var(--accent-primary)" /> My Orders
        </h1>

        <button onClick={fetchOrders} className="btn-secondary" style={{ fontSize: "0.85rem" }}>
          <RefreshCw size={15} /> Refresh List
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
          Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <div
          className="glass-panel"
          style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: "500px", margin: "0 auto" }}
        >
          <Package size={40} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
          <h3>No Orders Placed Yet</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            When you complete an order, its real-time lifecycle tracking will appear here.
          </p>
          <button onClick={onExploreCatalog} className="btn-primary">
            Explore Catalog
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {orders.map((order) => (
            <div
              key={order._id}
              className="glass-panel"
              onClick={() => onSelectOrder(order._id)}
              style={{
                padding: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1.25rem",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#ffffff" }}>
                    Order #{order._id.slice(-8)}
                  </span>
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
                    gap: "1rem",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{order.items?.length || 0} item(s)</span>
                  <span>•</span>
                  <span>Key: {order.idempotencyKey?.substring(0, 16)}...</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Paid</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 800, color: "#ffffff" }}>
                    ₹{order.total}
                  </div>
                </div>

                <button className="btn-secondary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}>
                  <Eye size={15} /> View State Tracker
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
