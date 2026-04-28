import { createFileRoute } from "@tanstack/react-router";
import AdminApp from "../apps/admin/AdminApp.jsx";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Kape sa Sulok — Admin Panel" },
      { name: "description", content: "System administration for Kape sa Sulok." },
    ],
  }),
  component: AdminApp,
});
