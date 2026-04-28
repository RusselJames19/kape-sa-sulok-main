import { createFileRoute } from "@tanstack/react-router";
import DashboardApp from "../apps/dashboard/DashboardApp.jsx";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Kape sa Sulok — Dashboard" },
      { name: "description", content: "Sales analytics and business insights for Kape sa Sulok." },
    ],
  }),
  component: DashboardApp,
});
