import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../lib/api";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res?.success) {
        setUser(res.user);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem("appzeto_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        if (res.token) {
          localStorage.setItem("appzeto_token", res.token);
        }
        setUser(res.user);
        addToast(`Welcome back, ${res.user.name}!`, "success");
        return { success: true };
      }
    } catch (err) {
      addToast(err.message || "Login failed", "error");
      return { success: false, message: err.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await authApi.register({ name, email, password });
      if (res.success) {
        if (res.token) {
          localStorage.setItem("appzeto_token", res.token);
        }
        setUser(res.user);
        addToast("Account created successfully!", "success");
        return { success: true };
      }
    } catch (err) {
      addToast(err.message || "Registration failed", "error");
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem("appzeto_token");
      addToast("Logged out successfully", "info");
    }
  };

  // Quick preset test switcher for testing convenience
  const loginAsPreset = async (type) => {
    if (type === "admin") {
      return login("admin@appzeto.com", "Admin@1234");
    } else {
      return login("user@appzeto.com", "User@1234");
    }
  };

  const addAddress = async (addrData) => {
    try {
      const res = await authApi.addAddress(addrData);
      if (res.success) {
        setUser((prev) => ({ ...prev, addresses: res.addresses }));
        addToast("Address saved successfully", "success");
        return { success: true };
      }
    } catch (err) {
      addToast(err.message || "Failed to add address", "error");
      return { success: false, message: err.message };
    }
  };

  const deleteAddress = async (id) => {
    try {
      const res = await authApi.deleteAddress(id);
      if (res.success) {
        setUser((prev) => ({ ...prev, addresses: res.addresses }));
        addToast("Address removed", "info");
        return { success: true };
      }
    } catch (err) {
      addToast(err.message || "Failed to remove address", "error");
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginAsPreset,
        addAddress,
        deleteAddress,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
