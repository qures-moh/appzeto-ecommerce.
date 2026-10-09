import React, { useState } from "react";
import { User, MapPin, Plus, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../lib/api";

export default function ProfileView() {
  const { user, refreshUser, addAddress, deleteAddress } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({ name, phone });
      if (res.success) {
        addToast("Profile updated successfully", "success");
        await refreshUser();
      }
    } catch (err) {
      addToast(err.message || "Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    const ok = await addAddress(newAddr);
    if (ok) {
      setShowAddAddress(false);
      setNewAddr({
        name: user?.name || "",
        phone: user?.phone || "",
        addressLine: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        isDefault: false,
      });
    }
  };

  return (
    <div className="container animate-fade" style={{ padding: "3rem 1.5rem" }}>
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
        <User size={28} color="var(--accent-primary)" /> Profile & Address Management
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "2.5rem",
          alignItems: "start",
        }}
      >
        {/* Left: Profile Info Form */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h3
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            Account Details
          </h3>

          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Full Name
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                className="input-field"
                value={user?.email || ""}
                style={{ opacity: 0.7, cursor: "not-allowed" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                Phone Number
              </label>
              <input
                type="text"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Role:</span>
              <span className={`badge ${user?.role === "ADMIN" ? "badge-shipped" : "badge-processing"}`}>
                {user?.role}
              </span>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary"
              style={{ marginTop: "0.5rem" }}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Right: Address Book */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={20} color="var(--accent-primary)" /> Address Book
            </h3>

            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="btn-secondary"
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
            >
              <Plus size={14} /> {showAddAddress ? "Close Form" : "Add Address"}
            </button>
          </div>

          {/* Add Address Form Toggle */}
          {showAddAddress && (
            <form
              onSubmit={handleAddAddressSubmit}
              style={{
                background: "rgba(15, 23, 42, 0.4)",
                padding: "1.25rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                marginBottom: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ffffff" }}>
                Add New Shipping Address
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <input
                  type="text"
                  placeholder="Recipient Name"
                  required
                  className="input-field"
                  value={newAddr.name}
                  onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  required
                  className="input-field"
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                />
              </div>

              <input
                type="text"
                placeholder="Street Address Line"
                required
                className="input-field"
                value={newAddr.addressLine}
                onChange={(e) => setNewAddr({ ...newAddr, addressLine: e.target.value })}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <input
                  type="text"
                  placeholder="City"
                  required
                  className="input-field"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="State"
                  required
                  className="input-field"
                  value={newAddr.state}
                  onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  required
                  className="input-field"
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newAddr.isDefault}
                  onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                />
                Set as default shipping address
              </label>

              <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                Save Address
              </button>
            </form>
          )}

          {/* List Addresses */}
          {user?.addresses?.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No addresses saved yet. Click "+ Add Address" above.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {user?.addresses?.map((addr) => (
                <div
                  key={addr._id}
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    background: "rgba(255, 255, 255, 0.02)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {addr.name} ({addr.phone})
                      {addr.isDefault && <span className="badge badge-paid">Default</span>}
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>{addr.addressLine}</div>
                    <div style={{ color: "var(--text-muted)" }}>
                      {addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAddress(addr._id)}
                    style={{ color: "var(--text-muted)", padding: "0.4rem" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    title="Delete address"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
