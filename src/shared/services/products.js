import { api } from "./api";

export const productsService = {
  list: () => api.get("/products").then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (data) => api.post("/products", data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  setAvailability: (id, available) =>
    api.post(`/products/${id}/availability`, { available }).then((r) => r.data),
};
