const Product = require("../models/Product");
const { tokenize } = require("../utils/fuzzy");

const SEARCH_FIELDS = [
  "Name",
  "Hinglish Name",
  "Hindi Name",
  "Exact Category",
  "Sub-Category",
  "Category",
  "Indian Category",
  "Indian Sub-Category",
  "Quantity",
];

const DISPLAY_FIELDS = [
  "Image",
  "Name",
  "Price",
  "Original Price",
  "Quantity",
  "Exact Category",
  "Category",
  "Hindi Name",
  "Hinglish Name",
  "Indian Category",
  "Indian Sub-Category",
];

/**
 * In-memory search index.
 *
 * Why: doing a full fuzzy (typo-tolerant) scan over thousands of documents
 * is much faster in plain JS over an array already sitting in RAM than as
 * a MongoDB query - there is no per-request DB round trip, no re-parsing
 * of BSON, and we can precompute the tokenized words for every field once
 * (at index-build time) instead of on every keystroke.
 *
 * The index is rebuilt automatically after every product create/update/
 * delete, on a periodic timer (safety net), and can be force-refreshed
 * via rebuildIndex() (e.g. after running the excel import script + a
 * server restart, or by calling POST /api/products/reindex).
 */
let index = [];
let lastBuiltAt = null;

async function rebuildIndex() {
  const projection = {};
  DISPLAY_FIELDS.forEach((f) => (projection[f] = 1));

  const docs = await Product.find({}, projection).lean();

  index = docs.map((doc) => {
    const wordsByField = {};
    for (const field of SEARCH_FIELDS) {
      wordsByField[field] = tokenize(doc[field]);
    }
    const lowerByField = {};
    for (const field of SEARCH_FIELDS) {
      lowerByField[field] = (doc[field] || "").toString().toLowerCase();
    }
    return { doc, wordsByField, lowerByField };
  });

  lastBuiltAt = new Date();
  console.log(`[SearchIndex] rebuilt with ${index.length} products at ${lastBuiltAt.toISOString()}`);
  return index.length;
}

function getIndex() {
  return index;
}

function getIndexMeta() {
  return { size: index.length, lastBuiltAt };
}

// Safety-net refresh every 10 minutes, in case a mutation happened
// through a path that forgot to call rebuildIndex() explicitly.
function startPeriodicRefresh(intervalMs = 10 * 60 * 1000) {
  setInterval(() => {
    rebuildIndex().catch((e) => console.error("[SearchIndex] periodic rebuild failed:", e.message));
  }, intervalMs);
}

module.exports = {
  rebuildIndex,
  getIndex,
  getIndexMeta,
  startPeriodicRefresh,
  SEARCH_FIELDS,
};
