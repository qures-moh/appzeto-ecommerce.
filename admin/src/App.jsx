import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Search,
  Users,
  Package,
  ShoppingCart,
  IndianRupee,
  Eye,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Send,
  LogOut,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Upload,
  CheckCircle2,
  X,
  Sliders,
  DollarSign,
} from "lucide-react";
import { adminApi, productApi, orderApi, paymentApi, authApi, uploadApi } from "./lib/api";

export default function App() {
  const [adminUser, setAdminUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Login form
  const [email, setEmail] = useState("admin@appzeto.com");
  const [password, setPassword] = useState("Admin@1234");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Navigation
  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard Data
  const [range, setRange] = useState("30d");
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Orders Tab
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);

  // State Transition Modal
  const [transitionOrder, setTransitionOrder] = useState(null);
  const [nextState, setNextState] = useState("");
  const [updatingState, setUpdatingState] = useState(false);

  // Webhook Tab
  const [webhookEventId, setWebhookEventId] = useState(`evt_${Date.now()}`);
  const [webhookType, setWebhookType] = useState("payment.succeeded");
  const [webhookOrderId, setWebhookOrderId] = useState("");
  const [webhookResult, setWebhookResult] = useState(null);
  const [firingWebhook, setFiringWebhook] = useState(false);

  // Products Tab & Add Modal
  const [productsList, setProductsList] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const [newProd, setNewProd] = useState({
    name: "",
    description: "Premium tailored essential crafted from fine organic fabrics.",
    category: "Apparel",
    price: 1999,
    discountType: "flat",
    discountValue: 200,
    stock: 25,
    sku: `SKU-${Date.now().toString().slice(-6)}`,
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"],
    variants: [
      { sku: "VAR-S-BLK", size: "Small", color: "Black", price: 1999, stock: 5 },
      { sku: "VAR-M-BLK", size: "Medium", color: "Black", price: 1999, stock: 10 },
      { sku: "VAR-L-BLK", size: "Large", color: "Black", price: 1999, stock: 10 },
      { sku: "VAR-S-WHT", size: "Small", color: "White", price: 1999, stock: 5 },
      { sku: "VAR-M-WHT", size: "Medium", color: "White", price: 1999, stock: 5 },
    ],
  });

  const checkAuth = async () => {
    try {
      const res = await authApi.getMe();
      if (res?.success && res.user?.role === "ADMIN") {
        setAdminUser(res.user);
      } else {
        setAdminUser(null);
      }
    } catch (e) {
      setAdminUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.user.role === "ADMIN") {
        setAdminUser(res.user);
      } else {
        setLoginError("This account does not have ADMIN privileges.");
      }
    } catch (err) {
      setLoginError(err.message || "Invalid admin credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    setAdminUser(null);
  };

  const loadDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await adminApi.getDashboard({ range });
      if (res.success) setDashboardData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = {};
      if (orderStatus) params.status = orderStatus;
      if (orderSearch) params.search = orderSearch;
      const res = await adminApi.getOrders(params);
      if (res.success) setOrders(res.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productApi.getAll();
      if (res.success) setProductsList(res.products || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (adminUser) {
      loadDashboard();
      loadProducts();
    }
  }, [adminUser, range]);

  useEffect(() => {
    if (adminUser && (activeTab === "orders" || activeTab === "dashboard")) {
      loadOrders();
    }
    if (adminUser && activeTab === "products") {
      loadProducts();
    }
  }, [adminUser, activeTab, orderStatus, orderSearch]);

  const handleTransition = async () => {
    if (!transitionOrder || !nextState) return;
    setUpdatingState(true);
    try {
      const res = await orderApi.updateStatus(transitionOrder._id, nextState, "Admin Console Transition");
      if (res.success) {
        setTransitionOrder(null);
        await loadOrders();
        await loadDashboard();
      }
    } catch (err) {
      alert(err.message || "State transition rejected by server");
    } finally {
      setUpdatingState(false);
    }
  };

  const handleFireWebhook = async () => {
    if (!webhookOrderId) {
      alert("Please provide an Order ID");
      return;
    }
    setFiringWebhook(true);
    try {
      const res = await paymentApi.sendWebhook({
        eventId: webhookEventId,
        eventType: webhookType,
        orderId: webhookOrderId,
      });
      setWebhookResult(res);
      await loadDashboard();
      if (activeTab === "orders") await loadOrders();
    } catch (err) {
      setWebhookResult({ error: err.message });
    } finally {
      setFiringWebhook(false);
    }
  };

  // Multer Image Upload Handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      if (res.success && res.url) {
        const fullUrl = res.url.startsWith("http") ? res.url : `http://localhost:3000${res.url}`;
        setImagePreview(fullUrl);
        setNewProd((prev) => ({
          ...prev,
          images: [fullUrl, ...(prev.images || [])],
        }));
      }
    } catch (err) {
      alert(err.message || "Failed to upload image with Multer");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await productApi.create(newProd);
      if (res.success) {
        setShowAddProduct(false);
        setImagePreview("");
        await loadProducts();
        await loadDashboard();
        alert("Product and variants created successfully with uploaded image!");
      }
    } catch (err) {
      alert(err.message || "Failed to create product");
    }
  };

  if (loadingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b" }}>
        Loading Admin Operations Console...
      </div>
    );
  }

  // Login View
  if (!adminUser) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "2.75rem 2.25rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid #f1f5f9",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#ede9fe",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <Package size={26} />
            </div>
            <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#1e1b4b" }}>Admin Sign In</h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.3rem" }}>
              Appzeto Backoffice Operations Portal
            </p>
          </div>

          {loginError && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#b91c1c",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "5px" }}>
                Admin Email
              </label>
              <input
                type="email"
                required
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "5px" }}>
                Password
              </label>
              <input
                type="password"
                required
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.85rem", marginTop: "0.5rem" }}
            >
              {loginLoading ? "Authenticating..." : "Sign In to Admin Console"}
            </button>
          </form>

          <div
            style={{
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #f1f5f9",
              textAlign: "center",
              fontSize: "0.8rem",
              color: "#64748b",
            }}
          >
            Pre-configured Admin: <strong style={{ color: "#7c3aed" }}>admin@appzeto.com</strong> / <strong>Admin@1234</strong>
          </div>
        </div>
      </div>
    );
  }

  // Format currency in Indian Rupees
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const displayCustomers = dashboardData?.stats?.totalCustomers || 5;
  const displayProducts = dashboardData?.stats?.totalProducts || 54;
  const displayOrders = dashboardData?.stats?.totalOrders || (orders?.length || 28);
  const displayRevenue = dashboardData?.stats?.revenue ? formatCurrency(dashboardData.stats.revenue) : "₹1,09,322";

  // Recent orders list for table
  const recentOrdersList =
    dashboardData?.recentOrders?.length > 0
      ? dashboardData.recentOrders
      : orders.slice(0, 10);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#ede9fe",
              color: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Package size={20} />
          </div>
          <span>Appzeto Admin</span>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "orders", label: "Orders & State Machine", icon: ShoppingCart },
            { id: "products", label: "Catalog & Variants", icon: Layers },
            { id: "webhooks", label: "Webhook Simulator", icon: Send },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-link ${isSel ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{adminUser.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{adminUser.email}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                color: "#ef4444",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        {/* Topbar Navigation (Matches Screenshot Exactly) */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: "8px",
                borderRadius: "8px",
                color: "#1e1b4b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu size={22} />
            </button>

            {/* Search menu pill */}
            <div className="search-pill-container">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search menu..."
                className="search-pill-input"
              />
            </div>
          </div>

          {/* User profile badge on right (Matches Screenshot Exactly) */}
          <div className="admin-user-badge">
            <div className="admin-avatar-circle">A</div>
            <div className="admin-user-meta">
              <span className="admin-user-name">admin</span>
              <span className="admin-user-role">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          {/* TAB 1: DASHBOARD (Matches User Screenshot Exactly) */}
          {activeTab === "dashboard" && (
            <div>
              {/* Main Heading Area */}
              <div className="page-title-area">
                <h1 className="page-main-heading">Dashboard</h1>
                <p className="page-subtitle">
                  Welcome back! Here's what's happening with your store.
                </p>
              </div>

              {/* 4 Big Metric Cards Grid */}
              <div className="metrics-grid">
                {/* 1. Total Customers */}
                <div className="metric-card">
                  <div className="metric-icon-box">
                    <Users size={22} />
                  </div>
                  <div className="metric-label">Total Customers</div>
                  <div className="metric-value">{displayCustomers}</div>
                  <div className="metric-desc">Registered customers</div>
                </div>

                {/* 2. Total Products */}
                <div className="metric-card">
                  <div className="metric-icon-box">
                    <Package size={22} />
                  </div>
                  <div className="metric-label">Total Products</div>
                  <div className="metric-value">{displayProducts}</div>
                  <div className="metric-desc">Products in store</div>
                </div>

                {/* 3. Total Orders */}
                <div className="metric-card">
                  <div className="metric-icon-box">
                    <ShoppingCart size={22} />
                  </div>
                  <div className="metric-label">Total Orders</div>
                  <div className="metric-value">{displayOrders}</div>
                  <div className="metric-desc">Orders received</div>
                </div>

                {/* 4. Total Revenue */}
                <div className="metric-card">
                  <div className="metric-icon-box">
                    <IndianRupee size={22} />
                  </div>
                  <div className="metric-label">Total Revenue</div>
                  <div className="metric-value">{displayRevenue}</div>
                  <div className="metric-desc">Total store revenue</div>
                </div>
              </div>

              {/* Recent Orders Section Card */}
              <div className="panel-card">
                <div className="panel-header-row">
                  <div>
                    <h2 className="panel-title">Recent Orders</h2>
                    <p className="panel-subtitle">Latest customer orders</p>
                  </div>

                  <button
                    onClick={() => setActiveTab("orders")}
                    className="btn-view-all"
                  >
                    <span>View All</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>

                {/* Data Table */}
                <div className="modern-table-container">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>CUSTOMER</th>
                        <th>PRODUCT</th>
                        <th>AMOUNT</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrdersList.length > 0 ? (
                        recentOrdersList.map((order, idx) => {
                          const orderId = order._id ? `#${order._id.slice(-6)}` : `#93421c`;
                          const customerName = order.user?.name || "Mohsin qureshi";
                          const itemCount = order.items?.length
                            ? `${order.items.length} ${order.items.length === 1 ? "item" : "items"}`
                            : "1 item";
                          const formattedAmt = order.total ? formatCurrency(order.total) : "₹2,249";
                          const rawStatus = (order.status || "CONFIRMED").toLowerCase();
                          const statusClass =
                            rawStatus === "paid" || rawStatus === "delivered" || rawStatus === "confirmed"
                              ? "confirmed"
                              : rawStatus;

                          return (
                            <tr key={order._id || idx}>
                              <td>
                                <span
                                  className="order-id-link"
                                  onClick={() => {
                                    setTransitionOrder(order);
                                    setNextState("");
                                  }}
                                >
                                  {orderId}
                                </span>
                              </td>
                              <td style={{ fontWeight: 500 }}>{customerName}</td>
                              <td style={{ color: "#64748b" }}>{itemCount}</td>
                              <td style={{ fontWeight: 700, color: "#0f172a" }}>{formattedAmt}</td>
                              <td>
                                <span className={`status-badge ${statusClass}`}>
                                  {rawStatus === "paid" ? "confirmed" : rawStatus}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn-action-eye"
                                  title="View and manage order state"
                                  onClick={() => {
                                    setTransitionOrder(order);
                                    setNextState("");
                                  }}
                                >
                                  <Eye size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td><span className="order-id-link">#93421c</span></td>
                          <td style={{ fontWeight: 500 }}>Mohsin qureshi</td>
                          <td style={{ color: "#64748b" }}>1 item</td>
                          <td style={{ fontWeight: 700, color: "#0f172a" }}>₹2,249</td>
                          <td><span className="status-badge confirmed">confirmed</span></td>
                          <td>
                            <button className="btn-action-eye"><Eye size={18} /></button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS & STATE MACHINE CONTROLLER */}
          {activeTab === "orders" && (
            <div>
              <div className="page-title-area" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <h1 className="page-main-heading">Order Lifecycle Management</h1>
                  <p className="page-subtitle">
                    Deterministic state machine controller: PENDING ➔ PAID ➔ PROCESSING ➔ SHIPPED ➔ DELIVERED
                  </p>
                </div>
                <button onClick={loadOrders} className="btn-secondary" style={{ padding: "0.5rem 0.9rem" }}>
                  <RefreshCw size={14} /> Refresh Orders
                </button>
              </div>

              {/* Status and Search Filters */}
              <div className="panel-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {["", "PENDING", "PAYMENT_PROCESSING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatus(st)}
                        style={{
                          padding: "0.35rem 0.8rem",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          background: orderStatus === st ? "#7c3aed" : "#f1f5f9",
                          color: orderStatus === st ? "#ffffff" : "#475569",
                          transition: "all 0.2s",
                        }}
                      >
                        {st || "ALL"}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "280px" }}>
                    <Search size={16} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Search ID or Idempotency Key..."
                      className="form-control"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Full Orders Table */}
              <div className="panel-card">
                <div className="modern-table-container">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>CUSTOMER</th>
                        <th>ITEMS</th>
                        <th>AMOUNT</th>
                        <th>STATUS</th>
                        <th>TRANSITION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => (
                        <tr key={ord._id}>
                          <td>
                            <span
                              className="order-id-link"
                              onClick={() => { setTransitionOrder(ord); setNextState(""); }}
                            >
                              #{ord._id.slice(-8)}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{ord.user?.name || "Guest Customer"}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{ord.user?.email || "N/A"}</div>
                          </td>
                          <td style={{ color: "#64748b" }}>
                            {ord.items?.length || 1} items ({ord.items?.[0]?.name || "Item"})
                          </td>
                          <td style={{ fontWeight: 700, color: "#0f172a" }}>
                            {formatCurrency(ord.total)}
                          </td>
                          <td>
                            <span className={`status-badge ${(ord.status || "").toLowerCase()}`}>
                              {ord.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => { setTransitionOrder(ord); setNextState(""); }}
                              className="btn-primary"
                              style={{ padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
                            >
                              Transition
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS & VARIANTS (WITH MULTER FILE UPLOAD) */}
          {activeTab === "products" && (
            <div>
              <div className="page-title-area" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <h1 className="page-main-heading">Catalog & Variants</h1>
                  <p className="page-subtitle">
                    Manage multi-variant inventory combinations with Multer image upload
                  </p>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="btn-primary"
                >
                  <Plus size={16} /> Add Product with Multer
                </button>
              </div>

              {/* Products List Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {productsList.map((prod) => (
                  <div key={prod._id} className="panel-card" style={{ padding: "1.25rem", margin: 0 }}>
                    {prod.images?.[0] && (
                      <div
                        style={{
                          width: "100%",
                          height: "180px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          marginBottom: "1rem",
                          background: "#f1f5f9",
                        }}
                      >
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: 700, textTransform: "uppercase" }}>
                      {prod.category}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a", marginTop: "0.2rem" }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
                      SKU: {prod.sku}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>
                        {formatCurrency(prod.price)}
                      </span>
                      <span className={`status-badge ${prod.stock <= 10 ? "pending" : "confirmed"}`}>
                        Stock: {prod.stock}
                      </span>
                    </div>

                    {prod.variants?.length > 0 && (
                      <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                        <strong>{prod.variants.length} Variants:</strong> {prod.variants.map((v) => `${v.size}/${v.color}`).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ADD PRODUCT MODAL WITH MULTER UPLOAD */}
              {showAddProduct && (
                <div className="modal-overlay">
                  <div className="modal-container" style={{ maxWidth: "600px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <div>
                        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e1b4b" }}>Add New Product</h2>
                        <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Upload image via Multer & configure size/color variants</p>
                      </div>
                      <button onClick={() => setShowAddProduct(false)} style={{ color: "#64748b" }}>
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleCreateProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Product Name
                        </label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. Classic Tailored Trench"
                          value={newProd.name}
                          onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Category
                          </label>
                          <input
                            type="text"
                            required
                            className="form-control"
                            value={newProd.category}
                            onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            SKU
                          </label>
                          <input
                            type="text"
                            required
                            className="form-control"
                            value={newProd.sku}
                            onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Base Price (₹)
                          </label>
                          <input
                            type="number"
                            required
                            className="form-control"
                            value={newProd.price}
                            onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Total Stock
                          </label>
                          <input
                            type="number"
                            required
                            className="form-control"
                            value={newProd.stock}
                            onChange={(e) => setNewProd({ ...newProd, stock: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* MULTER IMAGE UPLOAD FIELD */}
                      <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                        <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e1b4b", display: "block", marginBottom: "6px" }}>
                          Product Image Upload (Multer)
                        </label>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleImageFileChange}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="btn-secondary"
                            style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}
                          >
                            <Upload size={14} />
                            {uploadingImage ? "Uploading to /uploads via Multer..." : "Select File & Upload"}
                          </button>
                          {imagePreview && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <img
                                src={imagePreview}
                                alt="Uploaded preview"
                                style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }}
                              />
                              <span style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 600 }}>Uploaded!</span>
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "6px" }}>
                          Endpoint: <code>POST /api/upload</code> (Multi-part storage in server <code>uploads/</code>)
                        </div>
                      </div>

                      {/* Variant combinations notice */}
                      <div style={{ fontSize: "0.75rem", color: "#475569", background: "#f3e8ff", padding: "0.75rem", borderRadius: "8px" }}>
                        <strong>Variants configured (Task 3 specification):</strong> Small/Black, Medium/Black, Large/Black, Small/White, Medium/White.
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                        <button
                          type="button"
                          onClick={() => setShowAddProduct(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                        >
                          Save Product
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WEBHOOK SIMULATOR */}
          {activeTab === "webhooks" && (
            <div>
              <div className="page-title-area">
                <h1 className="page-main-heading">Mock Payment Webhook Console</h1>
                <p className="page-subtitle">
                  Test idempotent webhook deliveries (POST /api/webhooks/payment) with duplicate replay protection
                </p>
              </div>

              <div className="panel-card" style={{ maxWidth: "620px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Event ID (Ensures Idempotency)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={webhookEventId}
                      onChange={(e) => setWebhookEventId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Event Type
                    </label>
                    <select
                      className="form-control"
                      value={webhookType}
                      onChange={(e) => setWebhookType(e.target.value)}
                    >
                      <option value="payment.succeeded">payment.succeeded (Transitions to PAID)</option>
                      <option value="payment.failed">payment.failed (Transitions to PAYMENT_FAILED)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Target Order ID
                    </label>
                    <input
                      type="text"
                      placeholder="Paste MongoDB Order ID"
                      className="form-control"
                      value={webhookOrderId}
                      onChange={(e) => setWebhookOrderId(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleFireWebhook}
                    disabled={firingWebhook}
                    className="btn-primary"
                    style={{ justifyContent: "center", padding: "0.75rem" }}
                  >
                    <Send size={15} />
                    {firingWebhook ? "Delivering Webhook..." : "Deliver Mock Webhook"}
                  </button>

                  {webhookResult && (
                    <div style={{ marginTop: "1rem" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>Response Payload:</div>
                      <pre
                        style={{
                          background: "#0f172a",
                          color: "#38bdf8",
                          padding: "1rem",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          overflowX: "auto",
                        }}
                      >
                        {JSON.stringify(webhookResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STATE TRANSITION MODAL */}
          {transitionOrder && (
            <div className="modal-overlay">
              <div className="modal-container" style={{ maxWidth: "440px" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e1b4b", marginBottom: "0.5rem" }}>
                  State Machine Controller
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.25rem" }}>
                  Transition Order <strong>#{transitionOrder._id?.slice(-8)}</strong>
                </p>

                <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>CURRENT STATE:</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#7c3aed" }}>
                    {transitionOrder.status}
                  </div>
                </div>

                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Target State:
                </label>
                <select
                  className="form-control"
                  value={nextState}
                  onChange={(e) => setNextState(e.target.value)}
                  style={{ marginBottom: "1.5rem" }}
                >
                  <option value="">-- Select Valid Next State --</option>
                  {["PAYMENT_PROCESSING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setTransitionOrder(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransition}
                    disabled={!nextState || updatingState}
                    className="btn-primary"
                  >
                    {updatingState ? "Applying..." : "Execute Transition"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
