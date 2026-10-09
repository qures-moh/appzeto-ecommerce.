import React from "react";
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CartView({ onProceedCheckout, onContinueShopping, onAuthRequired }) {
  const { items, updateQuantity, removeFromCart, pricing, loading } = useCart();
  const { user } = useAuth();

  if (items.length === 0) {
    return (
      <div className="container animate-fade" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <div
          className="glass-panel"
          style={{ maxWidth: "500px", margin: "0 auto", padding: "3rem 2rem" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <ShoppingBag size={30} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2rem" }}>
            Explore our curated catalog and add high-performance items to your cart.
          </p>
          <button onClick={onContinueShopping} className="btn-primary" style={{ width: "100%" }}>
            Browse Catalog
          </button>
        </div>
      </div>
    );
  }

  const handleCheckoutClick = () => {
    if (!user) {
      onAuthRequired();
    } else {
      onProceedCheckout();
    }
  };

  return (
    <div className="container animate-fade" style={{ padding: "3rem 1.5rem" }}>
      <button
        onClick={onContinueShopping}
        className="btn-secondary"
        style={{ marginBottom: "1.75rem", fontSize: "0.85rem" }}
      >
        <ChevronLeft size={16} /> Continue Shopping
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
        <ShoppingBag size={28} color="var(--accent-primary)" /> Shopping Cart
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "2.5rem",
          alignItems: "start",
        }}
      >
        {/* Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((item) => {
            const product = item.product || {};
            const variant =
              product.variants?.find((v) => String(v._id) === String(item.variantId)) || null;
            const availableStock = variant ? variant.stock : product.stock || 0;

            const unitPrice = variant ? variant.price : product.price || 0;
            const discountAmount =
              product.discountType === "percentage"
                ? unitPrice * ((product.discountValue || 0) / 100)
                : (product.discountValue || 0);
            const discountedPrice = Math.max(0, unitPrice - discountAmount);
            const lineTotal = Math.round(discountedPrice * item.quantity * 100) / 100;

            return (
              <div
                key={item._id}
                className="glass-panel"
                style={{
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1.25rem",
                  flexWrap: "wrap",
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    background: "#1e293b",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={
                      product.images?.[0] ||
                      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
                    }
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {/* Details */}
                <div style={{ flex: "1 1 200px" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                    {product.name}
                  </h4>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    {variant ? (
                      <span style={{ color: "var(--accent-primary)" }}>
                        Variant: {variant.size} {variant.color ? `/ ${variant.color}` : ""} (SKU: {variant.sku})
                      </span>
                    ) : (
                      <span>SKU: {product.sku}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    ₹{discountedPrice}
                    {discountAmount > 0 && (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          textDecoration: "line-through",
                          marginLeft: "6px",
                        }}
                      >
                        ₹{unitPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1, availableStock)}
                      style={{ padding: "0.4rem 0.75rem", color: "var(--text-primary)", fontSize: "1rem" }}
                      title="Decrease quantity"
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        minWidth: "24px",
                        textAlign: "center",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (item.quantity >= availableStock) return;
                        updateQuantity(item._id, item.quantity + 1, availableStock);
                      }}
                      disabled={item.quantity >= availableStock}
                      style={{
                        padding: "0.4rem 0.75rem",
                        color: item.quantity >= availableStock ? "var(--text-muted)" : "var(--text-primary)",
                        fontSize: "1rem",
                        cursor: item.quantity >= availableStock ? "not-allowed" : "pointer",
                        opacity: item.quantity >= availableStock ? 0.4 : 1,
                      }}
                      title={item.quantity >= availableStock ? `Max available stock (${availableStock}) reached` : "Increase quantity"}
                    >
                      +
                    </button>
                  </div>
                  {item.quantity >= availableStock && (
                    <span style={{ fontSize: "0.68rem", color: "var(--accent-primary)", fontWeight: 700 }}>
                      Max stock ({availableStock})
                    </span>
                  )}
                </div>

                {/* Line Total */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    minWidth: "80px",
                    textAlign: "right",
                    color: "var(--text-primary)",
                  }}
                >
                  ₹{lineTotal}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeFromCart(item._id)}
                  style={{
                    color: "var(--text-muted)",
                    padding: "0.4rem",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Financial Breakdown Sidebar */}
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
            Order Summary
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Subtotal:</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 700 }}>
                ₹{pricing.subtotal}
              </span>
            </div>

            {pricing.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#047857" }}>
                <span>Discount Savings:</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  - ₹{pricing.discount}
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Tax (5%):</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                ₹{pricing.tax}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
              <span>Shipping Fee:</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                {pricing.shipping === 0 ? "FREE" : `₹${pricing.shipping}`}
              </span>
            </div>

            {pricing.shipping > 0 && (
              <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)" }}>
                Free shipping on orders over ₹1,000!
              </div>
            )}

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
              <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>Final Total:</span>
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
            onClick={handleCheckoutClick}
            className="btn-primary"
            style={{ width: "100%", marginTop: "1.75rem", padding: "0.85rem" }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          {!user && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textAlign: "center",
                marginTop: "0.75rem",
              }}
            >
              You will be prompted to sign in or use a demo account before placing your order.
            </p>
          )}

          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            <ShieldCheck size={16} color="#10b981" />
            Backend Price Verification: Front-end amounts are re-calculated and verified server-side.
          </div>
        </div>
      </div>
    </div>
  );
}
