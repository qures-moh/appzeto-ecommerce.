import React, { useState } from "react";
import {
  ShoppingBag,
  User,
  Package,
  LogOut,
  ChevronDown,
  Search,
  MapPin,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Navbar({ currentView, setCurrentView, search, setSearch }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#ffffff",
        borderBottom: "1px solid var(--border-subtle)",
        boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "4.75rem",
          gap: "1.5rem",
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView("catalog")}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "1.1rem",
              fontFamily: "var(--font-serif)",
            }}
          >
            A
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.35rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              appzeto
            </span>
          </div>
        </div>

        {/* Center Pill Navigation */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <button
            onClick={() => setCurrentView("catalog")}
            className={`nav-pill ${currentView === "catalog" ? "active" : ""}`}
          >
            Home
          </button>

          <button
            onClick={() => setCurrentView("catalog")}
            className="nav-pill"
          >
            Products
          </button>

          <button
            onClick={() => setCurrentView("catalog")}
            className="nav-pill"
          >
            Categories
          </button>

          {user && (
            <button
              onClick={() => setCurrentView("orders")}
              className={`nav-pill ${currentView === "orders" || currentView === "order-tracking" ? "active" : ""}`}
            >
              Orders
            </button>
          )}
        </nav>

        {/* Right Section: Search & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, justifyContent: "flex-end" }}>
          {/* Search bar matching screenshot */}
          <div
            style={{
              position: "relative",
              maxWidth: "240px",
              width: "100%",
            }}
          >
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search products..."
              className="input-field"
              value={search || ""}
              onChange={(e) => setSearch && setSearch(e.target.value)}
              style={{
                paddingLeft: "2.2rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                background: "var(--bg-secondary)",
              }}
            />
          </div>

          {/* Location Pill matching screenshot */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "var(--radius-full)",
              background: "#ffffff",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            <MapPin size={13} color="var(--accent-primary)" />
            <span>Indore, Madhya Pradesh</span>
          </div>

          {/* Wishlist Heart Icon */}
          <button
            onClick={() => setCurrentView("wishlist")}
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: wishlistCount > 0 ? "var(--accent-primary)" : "var(--text-secondary)",
              background: wishlistCount > 0 ? "var(--accent-light)" : "transparent",
              transition: "all 0.2s",
            }}
            title="View Wishlist"
          >
            <Heart size={18} fill={wishlistCount > 0 ? "var(--accent-primary)" : "none"} />
            {wishlistCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "var(--accent-primary)",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(211, 75, 38, 0.4)",
                }}
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon with badge */}
          <button
            onClick={() => setCurrentView("cart")}
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-primary)",
            }}
          >
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "var(--accent-primary)",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(211, 75, 38, 0.4)",
                }}
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* User Profile avatar */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--accent-light)",
                  border: "1px solid #fed7aa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-primary)",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>

              {dropdownOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: "absolute",
                    top: "120%",
                    right: 0,
                    width: "200px",
                    padding: "0.5rem",
                    zIndex: 2000,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderBottom: "1px solid var(--border-subtle)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{user.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {user.email}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentView("profile");
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <User size={15} /> My Profile
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView("orders");
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <Package size={15} /> My Orders
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.85rem",
                      color: "#dc2626",
                      borderRadius: "var(--radius-sm)",
                      borderTop: "1px solid var(--border-subtle)",
                      marginTop: "4px",
                    }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setCurrentView("auth")}
              className="btn-primary"
              style={{
                fontSize: "0.85rem",
                padding: "0.5rem 1.2rem",
                borderRadius: "var(--radius-full)",
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
