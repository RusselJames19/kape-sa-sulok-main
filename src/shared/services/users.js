import { api } from "./api";

export const usersService = {
  list: () => api.get("/users").then((r) => r.data),
  get: (id) => api.get(`/users/${id}`).then((r) => r.data),
  create: (data) => api.post("/users", data).then((r) => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
  resetPassword: (id, password) => api.post(`/users/${id}/password`, { password }).then((r) => r.data),
  activate: (id) => api.post(`/users/${id}/activate`).then((r) => r.data),
  deactivate: (id) => api.post(`/users/${id}/deactivate`).then((r) => r.data),
};
