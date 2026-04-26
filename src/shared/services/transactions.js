import { api } from "./api";

export const transactionsService = {
  list: (params) => api.get("/transactions", { params }).then((r) => r.data),
  get: (id) => api.get(`/transactions/${id}`).then((r) => r.data),
  create: (payload) => api.post("/transactions", payload).then((r) => r.data),
};
