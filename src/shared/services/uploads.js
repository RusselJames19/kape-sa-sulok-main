// Image upload service — POSTs multipart/form-data to /upload/image.
import { api } from "./api";

export const uploadsService = {
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return api
      .post("/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
