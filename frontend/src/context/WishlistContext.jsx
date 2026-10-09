import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "./ToastContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { addToast } = useToast();
  const [wishlist, setWishlist] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("appzeto_wishlist");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("appzeto_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist]);

  const isWishlisted = (productId) => {
    return wishlist.some((item) => (item._id || item.id) === (productId._id || productId));
  };

  const toggleWishlist = (product) => {
    if (!product) return;
    const prodId = product._id || product.id;
    const exists = isWishlisted(prodId);

    if (exists) {
      setWishlist((prev) => prev.filter((item) => (item._id || item.id) !== prodId));
      addToast(`Removed ${product.name} from Wishlist`, "info");
    } else {
      setWishlist((prev) => [product, ...prev]);
      addToast(`Saved ${product.name} to Wishlist!`, "success");
    }
  };

  const removeFromWishlist = (productId) => {
    const id = productId._id || productId;
    setWishlist((prev) => prev.filter((item) => (item._id || item.id) !== id));
    addToast("Item removed from Wishlist", "info");
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
