import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  ShoppingBag,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  Tag,
  Heart,
} from "lucide-react";
import { productApi } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function ProductDetailView({ productId, onBack }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const res = await productApi.getById(productId);
        if (res.success) {
          setProduct(res.product);
          if (res.product.variants && res.product.variants.length > 0) {
            setSelectedVariant(res.product.variants[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (productId) loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <h3>Product not found</h3>
        <button onClick={onBack} className="btn-secondary" style={{ marginTop: "1rem" }}>
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;

  const hasDiscount = (product.discountValue || 0) > 0;
  const discountAmount =
    product.discountType === "percentage"
      ? currentPrice * ((product.discountValue || 0) / 100)
      : (product.discountValue || 0);
  const finalUnitPrice = Math.max(0, currentPrice - discountAmount);

  const handleAddToCart = async () => {
    const ok = await addToCart(product, selectedVariant?._id || null, quantity);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div className="container animate-fade" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="btn-secondary"
        style={{ marginBottom: "2rem", fontSize: "0.85rem" }}
      >
        <ArrowLeft size={16} /> Back to Products
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "3.5rem",
          alignItems: "start",
        }}
      >
        {/* Left: Image Showcase */}
        <div>
          <div
            className="glass-panel"
            style={{
              overflow: "hidden",
              height: "440px",
              borderRadius: "var(--radius-lg)",
              position: "relative",
              marginBottom: "1rem",
            }}
          >
            <img
              src={
                product.images?.[activeImageIndex] ||
                product.images?.[0] ||
                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
              }
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {hasDiscount && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  background: "rgba(236, 72, 153, 0.95)",
                  backdropFilter: "blur(8px)",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  padding: "0.35rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Tag size={14} />
                {product.discountType === "percentage"
                  ? `${product.discountValue}% OFF`
                  : `SAVE ₹${product.discountValue}`}
              </div>
            )}

            {/* Wishlist Floating Button */}
            <button
              onClick={() => toggleWishlist(product)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(6px)",
                color: isWishlisted(product?._id) ? "var(--accent-primary)" : "var(--text-secondary)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                cursor: "pointer",
                transition: "all 0.2s",
                zIndex: 2,
              }}
              title={isWishlisted(product?._id) ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              <Heart size={20} fill={isWishlisted(product?._id) ? "var(--accent-primary)" : "none"} />
            </button>
          </div>

          {/* Thumbnail row if multiple images */}
          {product.images?.length > 1 && (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    border:
                      activeImageIndex === idx
                        ? "2px solid var(--accent-primary)"
                        : "1px solid var(--border-subtle)",
                    opacity: activeImageIndex === idx ? 1 : 0.6,
                    transition: "all 0.2s",
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Variant Picker */}
        <div>
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--accent-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            {product.category}
          </div>

          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              SKU: {currentSku}
            </span>

            {currentStock > 10 ? (
              <span className="badge badge-paid">In Stock ({currentStock})</span>
            ) : currentStock > 0 ? (
              <span className="badge badge-pending">Low Stock ({currentStock} units left)</span>
            ) : (
              <span className="badge badge-failed">Out of Stock</span>
            )}
          </div>

          {/* Pricing Row */}
          <div
            className="glass-panel"
            style={{
              padding: "1.25rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "baseline",
              gap: "1rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              ₹{finalUnitPrice}
            </span>

            {hasDiscount && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.2rem",
                  color: "var(--text-muted)",
                  textDecoration: "line-through",
                }}
              >
                ₹{currentPrice}
              </span>
            )}

            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "auto" }}>
              + 5% tax calculated at checkout
            </span>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            {product.description}
          </p>

          {/* Variants Selector */}
          {product.variants?.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: "0.75rem",
                }}
              >
                <span>Select Configuration (Size / Color):</span>
                {selectedVariant && (
                  <span style={{ color: "var(--accent-primary)" }}>
                    {selectedVariant.size} {selectedVariant.color ? `• ${selectedVariant.color}` : ""}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.6rem" }}>
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?._id === v._id;
                  const isVariantOutOfStock = v.stock <= 0;

                  return (
                    <button
                      key={v._id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={isVariantOutOfStock}
                      style={{
                        padding: "0.75rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                        border: isSelected
                          ? "2px solid var(--accent-primary)"
                          : "1px solid var(--border-subtle)",
                        background: isSelected
                          ? "var(--accent-light)"
                          : "var(--bg-secondary)",
                        opacity: isVariantOutOfStock ? 0.4 : 1,
                        cursor: isVariantOutOfStock ? "not-allowed" : "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.2rem",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {v.size || "Standard"}
                      </span>
                      {v.color && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {v.color}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                          color: v.stock <= 5 ? "var(--accent-primary)" : "var(--text-muted)",
                        }}
                      >
                        {v.stock} in stock
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              marginBottom: "2rem",
            }}
          >
            {/* Quantity Picker */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-secondary)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: "0.7rem 1rem", color: "var(--text-primary)", fontSize: "1.1rem" }}
              >
                -
              </button>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  padding: "0 0.8rem",
                  minWidth: "30px",
                  textAlign: "center",
                  color: "var(--text-primary)",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(currentStock || 99, quantity + 1))}
                disabled={quantity >= currentStock}
                style={{ padding: "0.7rem 1rem", color: "var(--text-primary)", fontSize: "1.1rem" }}
              >
                +
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              onClick={handleAddToCart}
              disabled={currentStock <= 0}
              className="btn-primary"
              style={{
                flex: 1,
                padding: "0.85rem 1.5rem",
                fontSize: "1rem",
              }}
            >
              {added ? (
                <>
                  <Check size={18} /> Added to Cart!
                </>
              ) : currentStock <= 0 ? (
                "Sold Out"
              ) : (
                <>
                  <ShoppingBag size={18} /> Add to Cart
                </>
              )}
            </button>

            {/* Wishlist Action Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: isWishlisted(product?._id) ? "var(--accent-light)" : "var(--bg-secondary)",
                color: isWishlisted(product?._id) ? "var(--accent-primary)" : "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
              title={isWishlisted(product?._id) ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              <Heart size={20} fill={isWishlisted(product?._id) ? "var(--accent-primary)" : "none"} />
            </button>
          </div>

          {/* Trust Guarantees */}
          <div
            style={{
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={16} color="#10b981" />
              <span>Concurrency Guarantee: Stock reserved atomically upon order creation.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={16} color="var(--accent-primary)" />
              <span>Full Idempotency Protection supported on checkout.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
