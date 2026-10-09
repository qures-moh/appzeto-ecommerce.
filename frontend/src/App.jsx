import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CatalogView from "./views/CatalogView";
import ProductDetailView from "./views/ProductDetailView";
import CartView from "./views/CartView";
import CheckoutView from "./views/CheckoutView";
import OrderListView from "./views/OrderListView";
import OrderTrackingView from "./views/OrderTrackingView";
import ProfileView from "./views/ProfileView";
import AuthView from "./views/AuthView";
import WishlistView from "./views/WishlistView";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { WishlistProvider } from "./context/WishlistContext";

function MainApp() {
  const [currentView, setCurrentView] = useState("catalog");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [search, setSearch] = useState("");

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setCurrentView("product-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setCurrentView("order-tracking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        search={search}
        setSearch={setSearch}
      />

      <main style={{ flex: 1 }}>
        {currentView === "catalog" && (
          <CatalogView
            onSelectProduct={handleSelectProduct}
            globalSearch={search}
          />
        )}

        {currentView === "product-detail" && (
          <ProductDetailView
            productId={selectedProductId}
            onBack={() => setCurrentView("catalog")}
          />
        )}

        {currentView === "cart" && (
          <CartView
            onProceedCheckout={() => setCurrentView("checkout")}
            onContinueShopping={() => setCurrentView("catalog")}
            onAuthRequired={() => setCurrentView("auth")}
          />
        )}

        {currentView === "checkout" && (
          <CheckoutView
            onBackToCart={() => setCurrentView("cart")}
            onOrderSuccess={(orderId) => {
              setSelectedOrderId(orderId);
              setCurrentView("order-tracking");
            }}
          />
        )}

        {currentView === "orders" && (
          <OrderListView
            onSelectOrder={handleSelectOrder}
            onExploreCatalog={() => setCurrentView("catalog")}
          />
        )}

        {currentView === "order-tracking" && (
          <OrderTrackingView
            orderId={selectedOrderId}
            onBack={() => setCurrentView("orders")}
          />
        )}

        {currentView === "wishlist" && (
          <WishlistView
            onSelectProduct={handleSelectProduct}
            onContinueShopping={() => setCurrentView("catalog")}
          />
        )}

        {currentView === "profile" && <ProfileView />}

        {currentView === "auth" && (
          <AuthView onSuccess={() => setCurrentView("catalog")} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <MainApp />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
