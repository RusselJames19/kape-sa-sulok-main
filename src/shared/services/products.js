import { api } from "./api";

export const productsService = {
  // POS uses { available_only: 1 } to get only sellable items.
  list: (params) => api.get("/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (data) => api.post("/products", data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  setAvailability: (id, available) =>
    api.post(`/products/${id}/availability`, { available }).then((r) => r.data),
};
