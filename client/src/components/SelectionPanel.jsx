import { useState } from "react";
import { exportProductsToExcel } from "../utils/exportExcel";

export default function SelectionPanel({ selectedItems, onRemove, onClear }) {
  const [open, setOpen] = useState(false);
  const count = selectedItems.length;

  if (count === 0) return null;

  function handleDownload() {
    const stamp = new Date().toISOString().slice(0, 10);
    exportProductsToExcel(selectedItems, `kirana-store-selected-items-${stamp}.xlsx`);
  }

  return (
    <div className="selection-panel">
      {open && (
        <div className="selection-list">
          <div className="selection-list-header">
            <span>{count} item{count > 1 ? "s" : ""} in your list</span>
            <button className="btn-small" onClick={onClear}>Clear all</button>
          </div>
          <div className="selection-list-items">
            {selectedItems.map((p) => (
              <div className="selection-list-row" key={p._id}>
                <img src={p.Image} alt="" />
                <div className="selection-list-text">
                  <div className="selection-list-name">{p.Name}</div>
                  <div className="selection-list-meta">
                    {p.Quantity ? `${p.Quantity} · ` : ""}₹{p.Price}
                  </div>
                </div>
                <button className="btn-small danger" onClick={() => onRemove(p._id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="selection-bar">
        <button className="selection-toggle" onClick={() => setOpen((o) => !o)}>
          🧾 {count} item{count > 1 ? "s" : ""} selected {open ? "▾" : "▴"}
        </button>
        <button className="btn-primary" onClick={handleDownload}>
          ⬇ Download Excel
        </button>
      </div>
    </div>
  );
}
