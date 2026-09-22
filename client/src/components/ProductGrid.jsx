import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  loading,
  loadingSeconds,
  loadError,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
}) {
  if (loading && products.length === 0) {
    return (
      <div aria-busy="true" aria-live="polite">
        <div className="results-loading">
          Loading products... {loadingSeconds > 0 ? `Waiting ${loadingSeconds}s. ` : ""}
          The store may be waking up and usually opens within 30 seconds.
        </div>
        <div className="grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="product-card skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return <div className="empty-state">{loadError}</div>;
  }

  if (!products.length) {
    return <div className="empty-state">No products found. Try a different search.</div>;
  }

  return (
    <div className="product-results" aria-busy={loading}>
      {loading && (
        <div className="results-loading" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          Searching... {loadingSeconds > 0 ? `Waiting ${loadingSeconds}s. ` : ""}
          Loading the latest results.
        </div>
      )}
      <div className="grid">
        {products.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            onEdit={onEdit}
            onDelete={onDelete}
            isSelected={selectedIds?.has(p._id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
