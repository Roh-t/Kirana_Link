import ProductCard from "./ProductCard";

export default function ProductGrid({ products, loading, onEdit, onDelete, selectedIds, onToggleSelect }) {
  if (loading && products.length === 0) {
    return (
      <div className="grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="product-card skeleton" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <div className="empty-state">No products found. Try a different search.</div>;
  }

  return (
    <div className="product-results" aria-busy={loading}>
      {loading && <div className="results-loading">Updating results...</div>}
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
