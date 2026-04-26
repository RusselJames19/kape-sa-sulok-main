import { api } from "./api";

export const analyticsService = {
  summary: () => api.get("/analytics/summary").then((r) => r.data),
  sales: (params) => api.get("/analytics/sales", { params }).then((r) => r.data),
  topProducts: (params) =>
    api.get("/analytics/top-products", { params }).then((r) => r.data),
  peakHours: (params) =>
    api.get("/analytics/peak-hours", { params }).then((r) => r.data),
};
