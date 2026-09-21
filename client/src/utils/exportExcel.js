import * as XLSX from "xlsx";

const HIDDEN_KEYS = new Set(["_id", "__v", "createdAt", "updatedAt", "_score"]);

// Preferred column order - matches your original excel sheet, so the
// downloaded file looks the same. Any extra/custom fields a product has
// get appended after these, so nothing is ever lost.
const PREFERRED_ORDER = [
  "Image",
  "Name",
  "Exact Category",
  "Price",
  "Original Price",
  "Quantity",
  "Sub-Category",
  "Category",
  "Hindi Name",
  "Hinglish Name",
  "Indian Category",
  "Indian Sub-Category",
];

export function exportProductsToExcel(products, filename = "kirana-store-selected-items.xlsx") {
  if (!products || products.length === 0) return;

  // Collect every key that appears across the selected products (so
  // custom fields added on individual products still show up as columns).
  const allKeys = new Set();
  products.forEach((p) => Object.keys(p).forEach((k) => !HIDDEN_KEYS.has(k) && allKeys.add(k)));

  const orderedKeys = [
    ...PREFERRED_ORDER.filter((k) => allKeys.has(k)),
    ...[...allKeys].filter((k) => !PREFERRED_ORDER.includes(k)),
  ];

  const rows = products.map((p) => {
    const row = {};
    orderedKeys.forEach((k) => (row[k] = p[k] ?? ""));
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: orderedKeys });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Items");
  XLSX.writeFile(workbook, filename);
}
