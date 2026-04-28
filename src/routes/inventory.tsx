import { createFileRoute } from "@tanstack/react-router";
import InventoryApp from "../apps/inventory/InventoryApp.jsx";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Kape sa Sulok — Inventory" },
      { name: "description", content: "Mobile inventory management for Kape sa Sulok managers." },
    ],
  }),
  component: InventoryApp,
});
