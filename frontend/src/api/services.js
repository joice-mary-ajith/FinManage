import api from "./client";

const data = (p) => p.then((r) => r.data);
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null));

export const authApi = {
  register: (body) => data(api.post("/auth/register", body)),
  login: (body) => data(api.post("/auth/login", body)),
  forgotPassword: (email) => data(api.post("/auth/forgot-password", { email })),
  resetPassword: (body) => data(api.post("/auth/reset-password", body)),
  me: () => data(api.get("/auth/me")),
};

export const accountApi = {
  list: () => data(api.get("/accounts")),
  create: (body) => data(api.post("/accounts", body)),
  update: (id, body) => data(api.put(`/accounts/${id}`, body)),
  remove: (id) => data(api.delete(`/accounts/${id}`)),
};

export const categoryApi = {
  list: () => data(api.get("/categories")),
  create: (body) => data(api.post("/categories", body)),
};

export const transactionApi = {
  list: (filters = {}) => data(api.get("/transactions", { params: clean(filters) })),
  create: (body) => data(api.post("/transactions", body)),
  update: (id, body) => data(api.put(`/transactions/${id}`, body)),
  remove: (id) => data(api.delete(`/transactions/${id}`)),
};

export const analyticsApi = {
  summary: (from, to) => data(api.get("/analytics/summary", { params: clean({ from, to }) })),
  breakdown: (from, to) => data(api.get("/analytics/category-breakdown", { params: clean({ from, to }) })),
  trend: (months = 6) => data(api.get("/analytics/trend", { params: { months } })),
  // The export route needs the JWT, so it is fetched as a blob and saved from memory instead of using a plain link.
  exportCsv: async () => {
    const res = await api.get("/analytics/export", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = Object.assign(document.createElement("a"), { href: url, download: "transactions.csv" });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  },
};

export const adminApi = {
  stats: () => data(api.get("/admin/stats")),
  users: () => data(api.get("/admin/users")),
  setUserActive: (id, active) => data(api.patch(`/admin/users/${id}/${active ? "activate" : "deactivate"}`)),
  categories: () => data(api.get("/admin/categories")),
  addCategory: (body) => data(api.post("/admin/categories", body)),
  updateCategory: (id, body) => data(api.put(`/admin/categories/${id}`, body)),
  removeCategory: (id) => data(api.delete(`/admin/categories/${id}`)),
};
