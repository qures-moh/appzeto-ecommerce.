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
    const token = localStorage.getItem("appzeto_admin_token");
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

export const authApi = {
  login: async (credentials) => {
    const res = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
    if (res?.token) {
      localStorage.setItem("appzeto_admin_token", res.token);
    }
    return res;
  },
  getMe: () => apiFetch("/auth/me"),
  logout: async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("appzeto_admin_token");
    }
  },
};

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

export const orderApi = {
  getById: (id) => apiFetch(`/orders/${id}`),
  updateStatus: (id, status, reason) =>
    apiFetch(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
};

export const productApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/products${query ? `?${query}` : ""}`);
  },
  create: (data) =>
    apiFetch("/products", { method: "POST", body: JSON.stringify(data) }),
  delete: (id) =>
    apiFetch(`/products/${id}`, { method: "DELETE" }),
};

export const paymentApi = {
  sendWebhook: (payload) =>
    apiFetch("/webhooks/payment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
