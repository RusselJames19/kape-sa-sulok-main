import { api } from "./api";

export const stockService = {
  // mode: 'set' | 'add'
  update: (variantId, payload) =>
    api.post(`/variants/${variantId}/stock`, payload).then((r) => r.data),
  lowStock: () => api.get("/inventory/low-stock").then((r) => r.data),
};

export const variantsService = {
  create: (data) => api.post("/variants", data).then((r) => r.data),
  update: (id, data) => api.put(`/variants/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/variants/${id}`).then((r) => r.data),
};
