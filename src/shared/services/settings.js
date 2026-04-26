// Settings service — wraps GET/PUT /settings.
import { api } from "./api";

export const settingsService = {
  async get() {
    const res = await api.get("/settings");
    return res.data?.settings || {};
  },
  async update(patch) {
    const res = await api.put("/settings", patch);
    return res.data?.settings || {};
  },
};

export const SETTINGS_DEFAULTS = {
  business_name: "Kape sa Sulok",
  business_address: "",
  logo_url: "",
  low_stock_threshold: "10",
  currency_symbol: "₱",
  receipt_footer: "Salamat sa pag-suporta!",
};
