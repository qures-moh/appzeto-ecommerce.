import React from "react";
import { Heart, ShoppingBag, Trash2, ArrowLeft, ArrowRight, Package } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

export default function WishlistView({ onSelectProduct, onContinueShopping }) {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div
        className="container animate-fade"
        style={{
          padding: "5rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--accent-light)",
            color: "var(--accent-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <Heart size={36} />
        </div>

        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Your Wishlist is Empty
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.95rem",
            maxWidth: "420px",
            marginBottom: "2rem",
            lineHeight: 1.5,
          }}
        >
          Curate your favorite styles and tailored essentials. Tap the heart icon on any product to save it for later.
        </p>

        <button
          onClick={onContinueShopping}
          className="btn-primary"
          style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}
        >
          Explore Boutique Collection <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade" style={{ padding: "3rem 1.5rem" }}>
      {/* Top row */}
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
        <div>
          <button
            onClick={onContinueShopping}
            className="btn-secondary"
            style={{ marginBottom: "1rem", fontSize: "0.85rem" }}
          >
            <ArrowLeft size={15} /> Continue Shopping
          </button>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "2.2rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              color: "var(--text-primary)",
            }}
          >
            <Heart size={28} color="var(--accent-primary)" fill="var(--accent-primary)" />
            My Wishlist ({wishlist.length})
          </h1>
        </div>

        <button
          onClick={clearWishlist}
          style={{
            fontSize: "0.85rem",
            color: "#dc2626",
            background: "transparent",
            padding: "0.5rem 0.8rem",
            borderRadius: "var(--radius-sm)",
          }}
        >
          Clear All
        </button>
      </div>

      {/* Grid of Wishlist Items */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "2rem",
        }}
      >
        {wishlist.map((prod) => {
          const discountAmt =
            prod.discountType === "percentage"
              ? prod.price * ((prod.discountValue || 0) / 100)
              : (prod.discountValue || 0);
          const finalPrice = Math.max(0, prod.price - discountAmt);

          return (
            <div
              key={prod._id}
              className="product-card"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Image preview */}
              <div
                onClick={() => onSelectProduct(prod._id)}
                style={{
                  position: "relative",
                  height: "280px",
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "#f1f5f9",
                }}
              >
                <img
                  src={
                    prod.images?.[0] ||
                    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
                  }
                  alt={prod.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {/* Remove from wishlist button badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(prod._id);
                  }}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.9)",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  title="Remove from Wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Info & CTA */}
              <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700, textTransform: "uppercase" }}>
                  {prod.category}
                </div>

                <h3
                  onClick={() => onSelectProduct(prod._id)}
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: "0.25rem 0 0.5rem",
                    cursor: "pointer",
                  }}
                >
                  {prod.name}
                </h3>

                <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "1rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    ₹{finalPrice}
                  </span>
                  {discountAmt > 0 && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                      ₹{prod.price}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: "auto", display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      const firstVariant = prod.variants?.[0]?._id;
                      addToCart(prod, firstVariant, 1);
                    }}
                    className="btn-primary"
                    style={{ flex: 1, padding: "0.6rem", fontSize: "0.85rem", justifyContent: "center" }}
                  >
                    <ShoppingBag size={15} /> Move to Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
