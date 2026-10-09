import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Package,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { adminApi, productApi, orderApi, paymentApi } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboardView({ onSelectOrder }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [range, setRange] = useState("30d");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'overview', 'orders', 'products', 'webhooks'
  const [activeTab, setActiveTab] = useState("overview");

  // Orders Tab
  const [adminOrders, setAdminOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Transition Order Modal
  const [selectedOrderToTransition, setSelectedOrderToTransition] = useState(null);
  const [targetStatus, setTargetStatus] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  // Webhook Simulator Tab
  const [webhookEventId, setWebhookEventId] = useState(`evt_${Date.now()}`);
  const [webhookEventType, setWebhookEventType] = useState("payment.succeeded");
  const [webhookOrderId, setWebhookOrderId] = useState("");
  const [webhookResult, setWebhookResult] = useState(null);
  const [sendingWebhook, setSendingWebhook] = useState(false);

  // Add Product Modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "Apparel",
    price: 999,
    discountType: "flat",
    discountValue: 100,
    stock: 20,
    sku: `SKU-${Date.now().toString().slice(-6)}`,
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"],
    variants: [
      { sku: "VAR-BLK-M", size: "Medium", color: "Black", price: 999, stock: 10 },
      { sku: "VAR-BLK-L", size: "Large", color: "Black", price: 999, stock: 10 },
    ],
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboard({ range });
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      addToast(err.message || "Failed to load admin metrics", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = {};
      if (orderStatusFilter) params.status = orderStatusFilter;
      if (orderSearch) params.search = orderSearch;
      const res = await adminApi.getOrders(params);
      if (res.success) {
        setAdminOrders(res.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchAdminOrders();
    }
  }, [activeTab, orderStatusFilter, orderSearch]);

  const handleExecuteStateTransition = async () => {
    if (!selectedOrderToTransition || !targetStatus) return;
    setTransitioning(true);
    try {
      const res = await orderApi.updateStatus(
        selectedOrderToTransition._id,
        targetStatus,
        "Admin dashboard override"
      );
      if (res.success) {
        addToast(res.message, "success");
        setSelectedOrderToTransition(null);
        await fetchAdminOrders();
        await fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || "State transition rejected by server validation", "error");
    } finally {
      setTransitioning(false);
    }
  };

  const handleFireMockWebhook = async () => {
    if (!webhookOrderId) {
      addToast("Please select or enter an Order ID", "error");
      return;
    }
    setSendingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await paymentApi.sendWebhook({
        eventId: webhookEventId,
        eventType: webhookEventType,
        orderId: webhookOrderId,
        transactionId: `txn_wh_${Date.now()}`,
      });
      setWebhookResult(res);
      addToast(
        res.replayed
          ? "Webhook replayed idempotently (duplicate ignored)!"
          : "Webhook processed successfully!",
        "success"
      );
      await fetchDashboard();
      if (activeTab === "orders") await fetchAdminOrders();
    } catch (err) {
      setWebhookResult({ error: err.message });
      addToast(err.message || "Webhook processing failed", "error");
    } finally {
      setSendingWebhook(false);
    }
  };

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await productApi.create(newProduct);
      if (res.success) {
        addToast("Product created successfully with variants!", "success");
        setShowAddProductModal(false);
        await fetchDashboard();
      }
    } catch (err) {
      addToast(err.message || "Failed to create product", "error");
    }
  };

  const { loginAsPreset } = useAuth();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container animate-fade" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <div className="glass-panel" style={{ maxWidth: "540px", margin: "0 auto", padding: "3rem 2rem" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(168, 85, 247, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              border: "1px solid rgba(168, 85, 247, 0.3)",
            }}
          >
            <ShieldCheck size={32} color="#a855f7" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Admin Access Required
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              marginBottom: "1.75rem",
              lineHeight: 1.6,
            }}
          >
            This portal is strictly protected by server-side Role-Based Access Control (RBAC).
            {user ? (
              <>
                <br />
                Currently active: <strong>{user.name}</strong> (Role: <span className="badge badge-processing">{user.role}</span>)
              </>
            ) : (
              " You are currently browsing as guest."
            )}
          </p>
          <button
            onClick={() => loginAsPreset("admin")}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "0.85rem" }}
          >
            <Sparkles size={16} /> Switch to Admin Demo Account (admin@appzeto.com)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade" style={{ padding: "3rem 1.5rem" }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span
              style={{
                background: "rgba(168, 85, 247, 0.2)",
                color: "#c084fc",
                padding: "0.25rem 0.65rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: "1px solid rgba(168, 85, 247, 0.35)",
              }}
            >
              ADMIN PANEL
            </span>
            <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Operations & Analytics</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Monitor real-time sales, order lifecycle transitions, inventory health, and idempotent webhooks.
          </p>
        </div>

        {/* Date Filter Range */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                fontWeight: 600,
                background: range === r ? "var(--accent-gradient)" : "rgba(255, 255, 255, 0.05)",
                color: range === r ? "#ffffff" : "var(--text-secondary)",
                border: range === r ? "none" : "1px solid var(--border-subtle)",
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button onClick={fetchDashboard} className="btn-secondary" style={{ padding: "0.45rem 0.75rem" }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (Requirement 11) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Revenue</span>
            <div style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)" }}>
              <DollarSign size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.85rem", fontWeight: 800, color: "#ffffff" }}>
            ₹{dashboardData?.stats?.revenue || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.35rem" }}>
            From fulfilled & paid orders
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Orders</span>
            <div style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(99, 102, 241, 0.15)" }}>
              <Package size={18} color="var(--accent-primary)" />
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.85rem", fontWeight: 800, color: "#ffffff" }}>
            {dashboardData?.stats?.totalOrders || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
            Orders placed in range
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Pending Orders</span>
            <div style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)" }}>
              <TrendingUp size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.85rem", fontWeight: 800, color: "#ffffff" }}>
            {dashboardData?.stats?.pendingOrders || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#fbbf24", marginTop: "0.35rem" }}>
            Awaiting payment / processing
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Failed Payments</span>
            <div style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)" }}>
              <CreditCard size={18} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.85rem", fontWeight: 800, color: "#ffffff" }}>
            {dashboardData?.stats?.failedPayments || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#f87171", marginTop: "0.35rem" }}>
            Decline / timeout events
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Low-Stock Alerts</span>
            <div style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(236, 72, 153, 0.15)" }}>
              <AlertTriangle size={18} color="#ec4899" />
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.85rem", fontWeight: 800, color: "#ffffff" }}>
            {dashboardData?.stats?.lowStockCount || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#f472b6", marginTop: "0.35rem" }}>
            Items with stock ≤ 10
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "2rem",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "0.75rem 1.25rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: activeTab === "overview" ? "#ffffff" : "var(--text-secondary)",
            borderBottom: activeTab === "overview" ? "3px solid var(--accent-primary)" : "none",
            background: "none",
          }}
        >
          Analytics & Overview
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "0.75rem 1.25rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: activeTab === "orders" ? "#ffffff" : "var(--text-secondary)",
            borderBottom: activeTab === "orders" ? "3px solid var(--accent-primary)" : "none",
            background: "none",
          }}
        >
          Order Lifecycle Management
        </button>

        <button
          onClick={() => setActiveTab("products")}
          style={{
            padding: "0.75rem 1.25rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: activeTab === "products" ? "#ffffff" : "var(--text-secondary)",
            borderBottom: activeTab === "products" ? "3px solid var(--accent-primary)" : "none",
            background: "none",
          }}
        >
          Catalog Inventory Controls
        </button>

        <button
          onClick={() => setActiveTab("webhooks")}
          style={{
            padding: "0.75rem 1.25rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: activeTab === "webhooks" ? "#ec4899" : "var(--text-secondary)",
            borderBottom: activeTab === "webhooks" ? "3px solid #ec4899" : "none",
            background: "none",
          }}
        >
          Mock Webhook Simulator (Req 10)
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Sales Analytics Chart (Requirement 11) */}
          <div className="glass-panel" style={{ padding: "1.75rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              Revenue & Order Trends ({range.toUpperCase()})
            </h3>

            {dashboardData?.salesTimeline?.length > 0 ? (
              <div style={{ height: "220px", display: "flex", alignItems: "flex-end", gap: "1rem", padding: "1rem 0" }}>
                {dashboardData.salesTimeline.map((item) => {
                  const maxRev = Math.max(...dashboardData.salesTimeline.map((t) => t.revenue || 1));
                  const heightPercent = Math.max(15, (item.revenue / maxRev) * 100);

                  return (
                    <div
                      key={item._id}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#ffffff", marginBottom: "4px" }}>
                        ₹{item.revenue}
                      </div>
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "48px",
                          height: `${heightPercent}%`,
                          background: "var(--accent-gradient)",
                          borderRadius: "4px 4px 0 0",
                          boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)",
                          transition: "height 0.3s ease",
                        }}
                        title={`Revenue: ₹${item.revenue} (${item.orders} orders)`}
                      />
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "6px" }}>
                        {item._id.slice(5)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                No completed sales recorded in this date range yet.
              </div>
            )}
          </div>

          {/* Low Stock & Top Products Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "2rem",
            }}
          >
            {/* Low Stock Products */}
            <div className="glass-panel" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Low-Stock Inventory Watch</h3>
              </div>

              {dashboardData?.lowStockProducts?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {dashboardData.lowStockProducts.map((p) => (
                    <div
                      key={p._id}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(245, 158, 11, 0.05)",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SKU: {p.sku}</div>
                      </div>
                      <span className="badge badge-pending">Stock: {p.stock} units</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>All products are well stocked.</p>
              )}
            </div>

            {/* Top Products */}
            <div className="glass-panel" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <TrendingUp size={18} color="#10b981" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Top-Selling Products</h3>
              </div>

              {dashboardData?.topProducts?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {dashboardData.topProducts.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.9rem" }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.totalUnitsSold} units sold</div>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
                        ₹{p.totalSales}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No sales data available yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER MANAGEMENT */}
      {activeTab === "orders" && (
        <div>
          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["", "PENDING", "PAYMENT_PROCESSING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: orderStatusFilter === st ? "var(--accent-gradient)" : "rgba(255, 255, 255, 0.05)",
                      color: orderStatusFilter === st ? "#ffffff" : "var(--text-secondary)",
                      border: orderStatusFilter === st ? "none" : "1px solid var(--border-subtle)",
                    }}
                  >
                    {st || "ALL"}
                  </button>
                )
              )}
            </div>

            <div style={{ position: "relative", minWidth: "250px" }}>
              <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search Order ID / Key..."
                className="input-field"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ paddingLeft: "2.2rem" }}
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="glass-panel" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "1rem" }}>Order ID</th>
                  <th style={{ padding: "1rem" }}>Customer</th>
                  <th style={{ padding: "1rem" }}>Status</th>
                  <th style={{ padding: "1rem" }}>Total</th>
                  <th style={{ padding: "1rem" }}>Date</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                      Loading orders...
                    </td>
                  </tr>
                ) : adminOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                      No orders found matching filters.
                    </td>
                  </tr>
                ) : (
                  adminOrders.map((ord) => (
                    <tr
                      key={ord._id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "1rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        #{ord._id.slice(-8)}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div>{ord.user?.name || "Customer"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ord.user?.email}</div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          className={`badge ${
                            ord.status === "PAID" || ord.status === "DELIVERED"
                              ? "badge-paid"
                              : ord.status === "CANCELLED"
                              ? "badge-cancelled"
                              : "badge-pending"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        ₹{ord.total}
                      </td>
                      <td style={{ padding: "1rem", color: "var(--text-muted)" }}>
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => onSelectOrder(ord._id)}
                            className="btn-secondary"
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                            title="Inspect Order"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrderToTransition(ord);
                              setTargetStatus("");
                            }}
                            className="btn-primary"
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                            title="Advance State Machine"
                          >
                            Change State
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* State Machine Transition Modal */}
          {selectedOrderToTransition && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3000,
                padding: "1rem",
              }}
            >
              <div
                className="glass-panel animate-fade"
                style={{ width: "100%", maxWidth: "460px", padding: "2rem" }}
              >
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  State Machine Controller
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                  Transitioning Order #{selectedOrderToTransition._id.slice(-8)}. Current state:{" "}
                  <strong>{selectedOrderToTransition.status}</strong>
                </p>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Select Valid Target State:
                  </label>
                  <select
                    className="input-field"
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                  >
                    <option value="">-- Choose Next State --</option>
                    {["PAYMENT_PROCESSING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map(
                      (st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      )
                    )}
                  </select>
                  <span style={{ fontSize: "0.75rem", color: "#a5b4fc", marginTop: "4px", display: "block" }}>
                    Note: Backend strictly rejects invalid transitions (e.g. DELIVERED → PENDING).
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setSelectedOrderToTransition(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteStateTransition}
                    disabled={!targetStatus || transitioning}
                    className="btn-primary"
                  >
                    {transitioning ? "Validating..." : "Apply Transition"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCTS & INVENTORY */}
      {activeTab === "products" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Catalog Management</h3>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="btn-primary"
              style={{ fontSize: "0.85rem" }}
            >
              <Plus size={16} /> Add Product with Variants
            </button>
          </div>

          <div
            className="glass-panel"
            style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}
          >
            {dashboardData?.lowStockProducts?.map((prod) => (
              <div
                key={prod._id}
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontWeight: 700, color: "#ffffff", marginBottom: "0.25rem" }}>{prod.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  SKU: {prod.sku} • Category: {prod.category}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>₹{prod.price}</span>
                  <span className="badge badge-pending">Stock: {prod.stock}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Product Modal */}
          {showAddProductModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3000,
                padding: "1rem",
              }}
            >
              <div
                className="glass-panel animate-fade"
                style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}
              >
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>
                  Create Product with Variants
                </h3>

                <form onSubmit={handleCreateProductSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g. Pro Mesh Running Jacket"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                      Description
                    </label>
                    <textarea
                      rows={2}
                      className="input-field"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Product features and materials..."
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Category
                      </label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Base SKU
                      </label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        required
                        className="input-field"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={newProduct.discountValue}
                        onChange={(e) => setNewProduct({ ...newProduct, discountValue: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Base Stock
                      </label>
                      <input
                        type="number"
                        required
                        className="input-field"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                    <button type="button" onClick={() => setShowAddProductModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Publish Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MOCK PAYMENT WEBHOOK SIMULATOR */}
      {activeTab === "webhooks" && (
        <div className="glass-panel" style={{ padding: "2rem", maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <Send size={22} color="#ec4899" />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              Mock Payment Webhook Simulator (Requirement 10)
            </h3>
          </div>

          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
            External payment gateways (like Stripe / Razorpay) send webhooks asynchronously. This console simulates a gateway
            webhook to <code>POST /api/webhooks/payment</code>. You can fire it multiple times with the same <strong>Event ID</strong> to verify that processing is strictly <strong>idempotent</strong>!
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Webhook Event ID (Used to enforce idempotency)
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  className="input-field"
                  value={webhookEventId}
                  onChange={(e) => setWebhookEventId(e.target.value)}
                  style={{ fontFamily: "var(--font-mono)" }}
                />
                <button
                  type="button"
                  onClick={() => setWebhookEventId(`evt_${Date.now()}`)}
                  className="btn-secondary"
                  style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
                >
                  New ID
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Event Type
              </label>
              <select
                className="input-field"
                value={webhookEventType}
                onChange={(e) => setWebhookEventType(e.target.value)}
              >
                <option value="payment.succeeded">payment.succeeded (Advances order to PAID)</option>
                <option value="payment.failed">payment.failed (Transitions order to PAYMENT_FAILED)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                Target Order ID
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Paste Order ID or pick from recent orders below"
                value={webhookOrderId}
                onChange={(e) => setWebhookOrderId(e.target.value)}
              />

              {dashboardData?.recentOrders?.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Recent:</span>
                  {dashboardData.recentOrders.slice(0, 3).map((o) => (
                    <button
                      key={o._id}
                      type="button"
                      onClick={() => setWebhookOrderId(o._id)}
                      style={{
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-mono)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "#a5b4fc",
                      }}
                    >
                      {o._id.slice(-6)} ({o.status})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                onClick={handleFireMockWebhook}
                disabled={sendingWebhook}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {sendingWebhook ? "Delivering Webhook..." : "Trigger Webhook POST"}
              </button>
            </div>

            {/* Webhook Response Output */}
            {webhookResult && (
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "1rem",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#34d399", marginBottom: "4px" }}>
                  Webhook Server Response:
                </div>
                <pre style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#cbd5e1", overflowX: "auto" }}>
                  {JSON.stringify(webhookResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
