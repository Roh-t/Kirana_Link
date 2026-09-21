import { useEffect, useRef, useState, useCallback } from "react";
import SearchBar from "./components/SearchBar";
import ProductGrid from "./components/ProductGrid";
import AddProductForm from "./components/AddProductForm";
import SelectionPanel from "./components/SelectionPanel";
import { fetchProducts, fetchProductById, fetchCategories, deleteProduct } from "./api";

const SELECTION_STORAGE_KEY = "kirana-store-selected-items";

function loadStoredSelection() {
  try {
    const raw = localStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export default function App() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedMap, setSelectedMap] = useState(loadStoredSelection); // { id: productObject }

  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const LIMIT = 30;

  const load = useCallback(async (q, cat, pg) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const data = await fetchProducts(
        { q, category: cat || undefined, page: pg, limit: LIMIT },
        controller.signal
      );
      setProducts(data.items);
      setTotal(data.total);
    } catch (e) {
      // ignore aborted
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(query, activeCategory, 1);
    }, 120);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeCategory]);

  useEffect(() => {
    load(query, activeCategory, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selectedMap));
  }, [selectedMap]);

  function toggleSelect(product) {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[product._id]) delete next[product._id];
      else next[product._id] = product;
      return next;
    });
  }

  function removeFromSelection(id) {
    setSelectedMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function clearSelection() {
    setSelectedMap({});
  }

  const selectedIds = new Set(Object.keys(selectedMap));
  const selectedItems = Object.values(selectedMap);

  async function handleEdit(product) {
    // The search-result list only carries display fields for speed;
    // fetch the full document (including any custom fields) before editing.
    try {
      const full = await fetchProductById(product._id);
      setEditingProduct(full);
    } catch (e) {
      setEditingProduct(product);
    }
    setShowForm(true);
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.Name}"?`)) return;
    await deleteProduct(product._id);
    load(query, activeCategory, page);
  }

  function handleSaved() {
    setShowForm(false);
    setEditingProduct(null);
    load(query, activeCategory, page);
  }

  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛒 Kirana Store</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
        >
          + Add Product
        </button>
      </header>

      <div className="search-section">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {categories.length > 0 && (
        <div className="category-pills">
          <button
            className={"pill" + (activeCategory === "" ? " active" : "")}
            onClick={() => setActiveCategory("")}
          >
            All
          </button>
          {categories.slice(0, 25).map((c) => (
            <button
              key={c}
              className={"pill" + (activeCategory === c ? " active" : "")}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="results-meta">
        {!loading && <span>{total} products found{query ? ` for "${query}"` : ""}</span>}
      </div>

      <ProductGrid
        products={products}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      <SelectionPanel
        selectedItems={selectedItems}
        onRemove={removeFromSelection}
        onClear={clearSelection}
      />

      {showForm && (
        <AddProductForm
          editingProduct={editingProduct}
          onSaved={handleSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
