const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "/api";

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("appzeto_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: "Failed to parse response",
  }));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Auth APIs
export const authApi = {
  login: (credentials) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (userData) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  getMe: () => apiFetch("/auth/me"),
  getProfile: () => apiFetch("/auth/profile"),
  updateProfile: (data) =>
    apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  getAddresses: () => apiFetch("/auth/addresses"),
  addAddress: (address) =>
    apiFetch("/auth/addresses", { method: "POST", body: JSON.stringify(address) }),
  deleteAddress: (id) =>
    apiFetch(`/auth/addresses/${id}`, { method: "DELETE" }),
};

// Product APIs
export const productApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/products${query ? `?${query}` : ""}`);
  },
  getById: (id) => apiFetch(`/products/${id}`),
  create: (data) =>
    apiFetch("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) =>
    apiFetch(`/products/${id}`, { method: "DELETE" }),
};

// Cart APIs
export const cartApi = {
  get: () => apiFetch("/cart"),
  addItem: (item) =>
    apiFetch("/cart/items", { method: "POST", body: JSON.stringify(item) }),
  updateItem: (id, quantity) =>
    apiFetch(`/cart/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  removeItem: (id) =>
    apiFetch(`/cart/items/${id}`, { method: "DELETE" }),
};

// Order APIs
export const orderApi = {
  create: (data, idempotencyKey) =>
    apiFetch("/orders", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(data),
    }),
  getAll: () => apiFetch("/orders"),
  getById: (id) => apiFetch(`/orders/${id}`),
  cancel: (id, reason) =>
    apiFetch(`/orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  updateStatus: (id, status, reason) =>
    apiFetch(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
};

// Payment APIs
export const paymentApi = {
  process: (data, idempotencyKey) =>
    apiFetch("/payments", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(data),
    }),
  sendWebhook: (payload) =>
    apiFetch("/webhooks/payment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// Admin APIs
export const adminApi = {
  getDashboard: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/admin/dashboard${query ? `?${query}` : ""}`);
  },
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/admin/orders${query ? `?${query}` : ""}`);
  },
};

// Upload API (Multer)
export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiFetch("/upload", {
      method: "POST",
      body: formData,
    });
  },
};
