import { createFileRoute } from "@tanstack/react-router";
import PosApp from "../apps/pos/PosApp.jsx";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "POS — Kape sa Sulok" },
      { name: "description", content: "Point-of-sale terminal for Kape sa Sulok cashiers and managers." },
    ],
  }),
  component: PosApp,
});
