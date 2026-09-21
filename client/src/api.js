import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://kirana-link-backend.onrender.com/api" : "/api");

const api = axios.create({ baseURL: apiBaseUrl });

export const fetchProducts = (params, signal) =>
  api.get("/products", { params, signal }).then((r) => r.data);

export const fetchSuggestions = (q, signal) =>
  api.get("/products/suggest", { params: { q }, signal }).then((r) => r.data);

export const fetchProductById = (id) => api.get(`/products/${id}`).then((r) => r.data);

export const fetchCategories = () =>
  api.get("/products/meta/categories").then((r) => r.data);

export const createProduct = (data) =>
  api.post("/products", data).then((r) => r.data);

export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((r) => r.data);

export const uploadImage = (file, onProgress) => {
  const form = new FormData();
  form.append("image", file);
  return api
    .post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then((r) => r.data);
};

export default api;