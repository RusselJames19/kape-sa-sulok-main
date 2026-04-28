// Backups service — admin-only operations against /backup/* endpoints.
import { api, getApiBaseUrl, getAccessToken } from "./api";

export const backupsService = {
  list: () => api.get("/backup/list").then((r) => r.data),

  generate: () => api.post("/backup/generate").then((r) => r.data),

  remove: (filename) =>
    api.delete(`/backup/${encodeURIComponent(filename)}`).then((r) => r.data),

  /**
   * Download a backup. Uses fetch with a blob response so the browser
   * triggers a real file save with the correct filename.
   */
  download: async (filename) => {
    const url = `${getApiBaseUrl()}/backup/download/${encodeURIComponent(filename)}`;
    const token = getAccessToken();
    const res = await fetch(url, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let msg = `Download failed (${res.status})`;
      try {
        const j = await res.json();
        if (j?.message) msg = j.message;
      } catch (_) { /* ignore */ }
      throw new Error(msg);
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  },
};
