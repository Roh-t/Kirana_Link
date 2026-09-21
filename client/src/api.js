import axios from "axios";

const api = axios.create({ baseURL: "/api" });

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