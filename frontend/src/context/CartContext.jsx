import React, { createContext, useContext, useState, useEffect } from "react";
import { cartApi } from "../lib/api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  // Sync cart from backend when user logs in
  const fetchCart = async () => {
    if (!user) {
      // Local storage fallback for guest
      const local = localStorage.getItem("appzeto_guest_cart");
      if (local) {
        try {
          setCart(JSON.parse(local));
        } catch (e) {}
      }
      return;
    }

    setLoading(true);
    try {
      const res = await cartApi.get();
      if (res.success && res.cart) {
        setCart(res.cart);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  // Persist guest cart to local storage
  useEffect(() => {
    if (!user) {
      localStorage.setItem("appzeto_guest_cart", JSON.stringify(cart));
    }
  }, [cart, user]);

  const addToCart = async (product, variantId = null, quantity = 1) => {
    const variant = product.variants?.find((v) => String(v._id) === String(variantId)) || null;
    const availableStock = variant ? variant.stock : product.stock || 0;

    if (availableStock <= 0) {
      addToast("This item is currently out of stock", "error");
      return false;
    }

    if (quantity > availableStock) {
      addToast(`Cannot add more than available stock (${availableStock} available)`, "error");
      return false;
    }

    if (user) {
      try {
        const res = await cartApi.addItem({
          productId: product._id,
          variantId: variantId || undefined,
          quantity,
        });
        if (res.success) {
          await fetchCart();
          addToast(`Added ${product.name} to cart!`, "success");
          return true;
        }
      } catch (err) {
        addToast(err.message || "Failed to add to cart", "error");
        return false;
      }
    } else {
      // Guest local update
      let exceeded = false;
      setCart((prev) => {
        const items = [...(prev.items || [])];
        const existingIndex = items.findIndex(
          (i) =>
            (i.product._id === product._id || i.product === product._id) &&
            String(i.variantId || "") === String(variantId || "")
        );

        if (existingIndex > -1) {
          const desired = items[existingIndex].quantity + quantity;
          if (desired > availableStock) {
            exceeded = true;
            items[existingIndex].quantity = availableStock;
          } else {
            items[existingIndex].quantity = Math.min(99, desired);
          }
        } else {
          items.push({
            _id: `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            product,
            variantId,
            quantity: Math.min(availableStock, quantity),
          });
        }
        return { ...prev, items };
      });

      if (exceeded) {
        addToast(`Stock limit reached! Capped to ${availableStock} units`, "warning");
      } else {
        addToast(`Added ${product.name} to cart!`, "success");
      }
      return true;
    }
  };

  const updateQuantity = async (itemId, newQuantity, maxStock = null) => {
    if (newQuantity < 1) return removeFromCart(itemId);

    if (maxStock !== null && newQuantity > maxStock) {
      addToast(`Cannot exceed available stock of ${maxStock} units`, "warning");
      return;
    }

    if (user) {
      try {
        const res = await cartApi.updateItem(itemId, newQuantity);
        if (res.success) {
          await fetchCart();
        }
      } catch (err) {
        addToast(err.message || "Failed to update quantity", "error");
      }
    } else {
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i._id === itemId ? { ...i, quantity: newQuantity } : i
        ),
      }));
    }
  };

  const removeFromCart = async (itemId) => {
    if (user) {
      try {
        const res = await cartApi.removeItem(itemId);
        if (res.success) {
          await fetchCart();
          addToast("Item removed from cart", "info");
        }
      } catch (err) {
        addToast(err.message || "Failed to remove item", "error");
      }
    } else {
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i._id !== itemId),
      }));
      addToast("Item removed from cart", "info");
    }
  };

  const clearCart = () => {
    setCart({ items: [] });
    if (!user) {
      localStorage.removeItem("appzeto_guest_cart");
    }
  };

  // Compute cart totals matching backend checkoutService logic
  const items = cart?.items || [];
  let subtotal = 0;
  let totalDiscount = 0;
  let itemCount = 0;

  for (const item of items) {
    const prod = item.product;
    if (!prod) continue;

    let unitPrice = prod.price || 0;
    if (item.variantId && prod.variants) {
      const v = prod.variants.find((v) => String(v._id) === String(item.variantId));
      if (v) unitPrice = v.price;
    }

    const discountAmount =
      prod.discountType === "percentage"
        ? unitPrice * ((prod.discountValue || 0) / 100)
        : (prod.discountValue || 0);

    const discountedUnit = Math.max(0, unitPrice - discountAmount);
    const itemOriginal = unitPrice * item.quantity;
    const itemDiscount = (unitPrice - discountedUnit) * item.quantity;

    subtotal += itemOriginal;
    totalDiscount += itemDiscount;
    itemCount += item.quantity;
  }

  const netSubtotal = Math.max(0, subtotal - totalDiscount);
  const tax = Math.round(netSubtotal * 0.05 * 100) / 100;
  const shipping = netSubtotal > 0 && netSubtotal < 1000 ? 50 : 0;
  const grandTotal = Math.round((netSubtotal + tax + shipping) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart: fetchCart,
        clearCart,
        pricing: {
          subtotal: Math.round(subtotal * 100) / 100,
          discount: Math.round(totalDiscount * 100) / 100,
          tax,
          shipping,
          grandTotal,
        },
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
