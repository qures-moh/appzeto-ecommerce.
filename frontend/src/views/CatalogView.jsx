import React, { useState, useEffect } from "react";
import {
  Tag,
  ShieldCheck,
  Truck,
  Star,
  ShoppingBag,
  Check,
  ArrowRight,
  Filter,
  Heart,
} from "lucide-react";
import { productApi } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function CatalogView({ onSelectProduct, globalSearch }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [addedId, setAddedId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (globalSearch && globalSearch.trim()) params.search = globalSearch.trim();
      const res = await productApi.getAll(params);
      if (res.success) {
        setProducts(res.products || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [globalSearch, selectedCategory]);

  const categories = ["All", "Apparel", "Footwear", "Outerwear", "Electronics", "Accessories"];

  const handleQuickAdd = async (e, product) => {
    e.stopPropagation();
    const variantId = product.variants?.[0]?._id || null;
    const ok = await addToCart(product, variantId, 1);
    if (ok) {
      setAddedId(product._id);
      setTimeout(() => setAddedId(null), 1500);
    }
  };

  return (
    <div className="animate-fade">
      {/* Hero Section matching the user's reference image */}
      <section className="container" style={{ padding: "1.5rem 1.5rem 2rem" }}>
        <div
          style={{
            position: "relative",
            minHeight: "420px",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            padding: "3rem",
            backgroundImage: `url("https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600&auto=format&fit=crop&q=80")`,
            backgroundSize: "cover",
            backgroundPosition: "center 35%",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Subtle warm wash */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 60%, transparent 100%)",
            }}
          />

          {/* Frosted Glass Overlay Card */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "500px",
              padding: "2.75rem",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.9)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "2.8rem",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                marginBottom: "1rem",
              }}
            >
              YOUR STYLE,<br />YOUR MOMENT.
            </h1>

            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "2rem",
              }}
            >
              Curated Designer Outfits, Performance Footwear & Premium Essentials.
              Guaranteed atomic inventory reservation with zero overselling.
            </p>

            <button
              onClick={() => {
                const el = document.getElementById("catalog-products");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-primary"
              style={{
                textTransform: "uppercase",
                fontSize: "0.85rem",
                letterSpacing: "0.06em",
                padding: "0.85rem 2rem",
                borderRadius: "var(--radius-sm)",
              }}
            >
              BOOK YOUR LOOK
            </button>
          </div>
        </div>

        {/* 4 Feature Badges under Hero Banner matching reference image */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginTop: "1.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                Verified boutiques
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Curated designer partners
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <Truck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                Doorstep delivery
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Per-vendor at checkout
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <Tag size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                Designer rentals
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Outfits & jewellery
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <Star size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                4.9★ rated
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                From 2,400+ reviews
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Filter */}
      <section id="catalog-products" className="container" style={{ paddingTop: "2.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Featured Collections
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Explore handpicked garments, footwear, and accessories
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "0.45rem 1.1rem",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  background: selectedCategory === cat ? "var(--accent-primary)" : "var(--bg-secondary)",
                  color: selectedCategory === cat ? "#ffffff" : "var(--text-secondary)",
                  border: selectedCategory === cat ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container" style={{ marginBottom: "5rem" }}>
        {loading ? (
          <div style={{ padding: "4rem 0", textAlign: "center", color: "var(--text-muted)" }}>
            Loading curated items...
          </div>
        ) : products.length === 0 ? (
          <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
            <h3>No products found</h3>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              Try adjusting your category filter.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
              gap: "2rem",
            }}
          >
            {products.map((product) => {
              const hasDiscount = (product.discountValue || 0) > 0;
              const discountedPrice =
                product.discountType === "percentage"
                  ? Math.round((product.price * (1 - product.discountValue / 100)) * 100) / 100
                  : Math.max(0, product.price - (product.discountValue || 0));

              const isLowStock = product.stock > 0 && product.stock <= 10;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product._id}
                  className="glass-panel"
                  onClick={() => onSelectProduct(product._id)}
                  style={{
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Product Image */}
                  <div
                    style={{
                      position: "relative",
                      height: "280px",
                      background: "#f5f3ef",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={
                        product.images?.[0] ||
                        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
                      }
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />

                    {/* Terracotta discount ribbon */}
                    {hasDiscount && (
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "var(--accent-primary)",
                          color: "#ffffff",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.55rem",
                          borderRadius: "4px",
                        }}
                      >
                        {product.discountType === "percentage"
                          ? `${product.discountValue}% OFF`
                          : `SAVE ₹${product.discountValue}`}
                      </div>
                    )}

                    {/* Stock Alert Badge */}
                    <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                      {isOutOfStock ? (
                        <span className="badge badge-failed">Sold Out</span>
                      ) : isLowStock ? (
                        <span className="badge badge-pending">Only {product.stock} Left</span>
                      ) : (
                        <span className="badge badge-paid">In Stock</span>
                      )}
                    </div>

                    {/* Wishlist Heart Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.9)",
                        color: isWishlisted(product._id) ? "var(--accent-primary)" : "var(--text-secondary)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                      title={isWishlisted(product._id) ? "Remove from Wishlist" : "Save to Wishlist"}
                    >
                      <Heart size={16} fill={isWishlisted(product._id) ? "var(--accent-primary)" : "none"} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.3rem" }}>
                      {product.category}
                    </div>

                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "0.4rem",
                        lineHeight: 1.35,
                      }}
                    >
                      {product.name}
                    </h3>

                    {product.variants?.length > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", marginBottom: "0.75rem", fontWeight: 600 }}>
                        {product.variants.length} Sizes & Color Combinations
                      </div>
                    )}

                    <div style={{ marginTop: "auto", paddingTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            ₹{discountedPrice}
                          </span>
                          {hasDiscount && (
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                              ₹{product.price}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        disabled={isOutOfStock}
                        className={addedId === product._id ? "btn-secondary" : "btn-primary"}
                        style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", borderRadius: "6px" }}
                      >
                        {addedId === product._id ? (
                          <>
                            <Check size={14} color="#059669" /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={14} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
