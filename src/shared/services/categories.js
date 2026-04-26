import { api } from "./api";

export const categoriesService = {
  list: (params) => api.get("/categories", { params }).then((r) => r.data),
  create: (data) => api.post("/categories", data).then((r) => r.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data),
  deactivate: (id) => api.post(`/categories/${id}/deactivate`).then((r) => r.data),
};
