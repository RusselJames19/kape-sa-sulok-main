import { createFileRoute } from "@tanstack/react-router";
import { InventoryShell } from "../apps/_shells.jsx";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Kape sa Sulok" },
      { name: "description", content: "Mobile inventory management for Kape sa Sulok managers." },
    ],
  }),
  component: InventoryShell,
});
