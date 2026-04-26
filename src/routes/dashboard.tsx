import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "../apps/_shells.jsx";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Kape sa Sulok" },
      { name: "description", content: "Sales analytics and business insights for Kape sa Sulok." },
    ],
  }),
  component: DashboardShell,
});
