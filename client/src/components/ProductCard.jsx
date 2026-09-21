export default function ProductCard({ product, onEdit, onDelete, isSelected, onToggleSelect }) {
  const discount =
    product["Original Price"] && product.Price && product["Original Price"] > product.Price
      ? Math.round(100 - (product.Price / product["Original Price"]) * 100)
      : null;

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        {product.Image ? (
          <img src={product.Image} alt={product.Name} loading="lazy" />
        ) : (
          <div className="product-img-placeholder">No Image</div>
        )}
        {discount ? <span className="discount-badge">{discount}% OFF</span> : null}
      </div>
      <div className="product-body">
        <div className="product-name" title={product.Name}>
          {product.Name}
        </div>
        <div className="product-sub">{product["Exact Category"] || product.Category}</div>
        {product.Quantity && <div className="product-qty">{product.Quantity}</div>}
        <div className="product-price-row">
          <span className="product-price">₹{product.Price}</span>
          {product["Original Price"] && product["Original Price"] > product.Price && (
            <span className="product-original-price">₹{product["Original Price"]}</span>
          )}
        </div>
        <button
          className={"add-to-list-btn" + (isSelected ? " added" : "")}
          onClick={() => onToggleSelect(product)}
        >
          {isSelected ? "✓ Added to list" : "+ Add to list"}
        </button>
        <div className="product-actions">
          <button className="btn-small" onClick={() => onEdit(product)}>Edit</button>
        </div>
      </div>
    </div>
  );
}
