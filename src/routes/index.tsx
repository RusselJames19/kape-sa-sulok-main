import { createFileRoute } from "@tanstack/react-router";
import Landing from "../pages/Landing.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kape sa Sulok — Business Management System" },
      {
        name: "description",
        content:
          "Unified management system for Kape sa Sulok café — POS, Inventory, Dashboard, and Admin.",
      },
      { property: "og:title", content: "Kape sa Sulok — Business Management System" },
      {
        property: "og:description",
        content:
          "Unified management system for Kape sa Sulok café — POS, Inventory, Dashboard, and Admin.",
      },
    ],
  }),
  component: Landing,
});
