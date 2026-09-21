import { useEffect, useState } from "react";
import { uploadImage, createProduct, updateProduct } from "../api";

const BASE_FIELDS = [
  { key: "Name", label: "Name", type: "text", required: true },
  { key: "Exact Category", label: "Exact Category", type: "text" },
  { key: "Category", label: "Category", type: "text" },
  { key: "Sub-Category", label: "Sub-Category", type: "text" },
  { key: "Price", label: "Price", type: "number" },
  { key: "Original Price", label: "Original Price", type: "number" },
  { key: "Quantity", label: "Quantity", type: "text" },
  { key: "Hindi Name", label: "Hindi Name", type: "text" },
  { key: "Hinglish Name", label: "Hinglish Name", type: "text" },
  { key: "Indian Category", label: "Indian Category", type: "text" },
  { key: "Indian Sub-Category", label: "Indian Sub-Category", type: "text" },
];

const emptyForm = () => Object.fromEntries(BASE_FIELDS.map((f) => [f.key, ""]));

export default function AddProductForm({ editingProduct, onSaved, onCancel }) {
  const [form, setForm] = useState(emptyForm());
  const [customFields, setCustomFields] = useState([]); // [{key, value}]
  const [imageUrl, setImageUrl] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingProduct) {
      const base = {};
      BASE_FIELDS.forEach((f) => (base[f.key] = editingProduct[f.key] ?? ""));
      setForm(base);
      setImageUrl(editingProduct.Image || "");

      const known = new Set([
        "_id", "__v", "createdAt", "updatedAt", "Image",
        ...BASE_FIELDS.map((f) => f.key),
      ]);
      const extras = Object.entries(editingProduct)
        .filter(([k]) => !known.has(k))
        .map(([key, value]) => ({ key, value: String(value ?? "") }));
      setCustomFields(extras);
    } else {
      setForm(emptyForm());
      setCustomFields([]);
      setImageUrl("");
    }
    setShowImagePreview(false);
  }, [editingProduct]);

  useEffect(() => {
    if (!showImagePreview) return undefined;

    function handleKeyDown(e) {
      if (e.key === "Escape") setShowImagePreview(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showImagePreview]);

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadPct(0);
    setError("");
    try {
      const res = await uploadImage(file, setUploadPct);
      setImageUrl(res.url);
    } catch (err) {
      setError("Image upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  }

  function addCustomField() {
    setCustomFields((prev) => [...prev, { key: "", value: "" }]);
  }

  function updateCustomField(idx, field, val) {
    setCustomFields((prev) =>
      prev.map((cf, i) => (i === idx ? { ...cf, [field]: val } : cf))
    );
  }

  function removeCustomField(idx) {
    setCustomFields((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.Name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, Image: imageUrl };
      if (payload.Price !== "") payload.Price = Number(payload.Price);
      if (payload["Original Price"] !== "") payload["Original Price"] = Number(payload["Original Price"]);

      customFields.forEach(({ key, value }) => {
        if (key.trim()) payload[key.trim()] = value;
      });

      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="image-upload-section">
            {imageUrl ? (
              <button
                type="button"
                className="image-preview-button"
                onClick={() => setShowImagePreview(true)}
                aria-label="View larger image"
              >
                <img src={imageUrl} alt="Preview" className="image-preview" />
              </button>
            ) : (
              <div className="image-preview placeholder">No image</div>
            )}
            <label className="upload-btn">
              {uploading ? `Uploading... ${uploadPct}%` : "Choose Image"}
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
          </div>

          <div className="form-grid">
            {BASE_FIELDS.map((f) => (
              <div className="form-field" key={f.key}>
                <label>{f.label}{f.required && " *"}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="custom-fields-section">
            <div className="custom-fields-header">
              <span>Custom fields (add any extra column you want)</span>
              <button type="button" className="btn-small" onClick={addCustomField}>+ Add Field</button>
            </div>
            {customFields.map((cf, i) => (
              <div className="custom-field-row" key={i}>
                <input
                  placeholder="Field name (e.g. Brand)"
                  value={cf.key}
                  onChange={(e) => updateCustomField(i, "key", e.target.value)}
                />
                <input
                  placeholder="Value"
                  value={cf.value}
                  onChange={(e) => updateCustomField(i, "value", e.target.value)}
                />
                <button type="button" className="btn-small danger" onClick={() => removeCustomField(i)}>✕</button>
              </div>
            ))}
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || uploading}>
              {saving ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {showImagePreview && imageUrl && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Larger product image"
          onMouseDown={(e) => e.target === e.currentTarget && setShowImagePreview(false)}
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setShowImagePreview(false)}
            aria-label="Close larger image"
          >
            ×
          </button>
          <img src={imageUrl} alt="Larger product preview" className="image-lightbox-content" />
        </div>
      )}
    </div>
  );
}
