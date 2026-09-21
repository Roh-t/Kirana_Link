const express = require("express");
const Product = require("../models/Product");
const { getIndex, rebuildIndex, getIndexMeta, SEARCH_FIELDS } = require("../services/searchIndex");
const { tokenize, scoreTokenAgainstField } = require("../utils/fuzzy");
const { getSynonyms } = require("../data/synonyms");

const router = express.Router();

const FIELD_WEIGHT = {
  Name: 10,
  "Hinglish Name": 8,
  "Hindi Name": 8,
  "Exact Category": 5,
  "Sub-Category": 4,
  Category: 3,
  "Indian Category": 3,
  "Indian Sub-Category": 3,
  Quantity: 1,
};

/**
 * Rank the whole in-memory catalog against a query.
 * Every query token is scored against every searchable field of every
 * product (exact > prefix > substring > fuzzy-typo, see utils/fuzzy.js),
 * weighted by how important that field is (Name matters far more than
 * Quantity). This single pass gives us both "normal" relevance ranking
 * AND typo-tolerance (atta / aata / aaata / attaa all resolve the same
 * way) without needing two separate search strategies.
 */
function rankCatalog(query, limit) {
  const rawTokens = tokenize(query).slice(0, 6);
  if (rawTokens.length === 0) return [];

  // Expand each token with its Hinglish<->English synonyms (e.g. "chawal"
  // also searches "rice", "fal" also searches "fruit"). Synonym-derived
  // tokens are weighted slightly lower than a direct/native-language
  // match, so an exact match still wins when both exist.
  const weightedTokens = [];
  for (const tok of rawTokens) {
    weightedTokens.push({ token: tok, mult: 1 });
    for (const syn of getSynonyms(tok)) {
      weightedTokens.push({ token: syn, mult: 0.85 });
    }
  }

  const idx = getIndex();
  const scored = [];

  for (const entry of idx) {
    let score = 0;
    for (const { token, mult } of weightedTokens) {
      for (const field of SEARCH_FIELDS) {
        const weight = FIELD_WEIGHT[field] || 1;
        const s = scoreTokenAgainstField(token, entry.lowerByField[field], entry.wordsByField[field]);
        if (s > 0) score += s * weight * mult;
      }
    }
    if (score > 0) scored.push({ doc: entry.doc, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => ({ ...s.doc, _score: s.score }));
}

// GET /api/products?q=&page=&limit=&category=
router.get("/", (req, res) => {
  handleList(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  });
});

async function handleList(req, res) {
  const { q = "", page = 1, limit = 30, category } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(parseInt(limit, 10) || 30, 100);

  if (q && q.trim()) {
    let results = rankCatalog(q, 500);
    if (category) {
      results = results.filter(
        (r) => r["Exact Category"] === category || r["Category"] === category
      );
    }
    const total = results.length;
    const start = (pageNum - 1) * lim;
    const paged = results.slice(start, start + lim);
    return res.json({ items: paged, total, page: pageNum, limit: lim });
  }

  const filter = category
    ? { $or: [{ "Exact Category": category }, { Category: category }] }
    : {};
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * lim).limit(lim).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, limit: lim });
}

// GET /api/products/suggest?q=  -> lightweight, fast, for the live dropdown
router.get("/suggest", (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) return res.json([]);
    const results = rankCatalog(q, 8);
    const lite = results.map((r) => ({
      _id: r._id,
      Name: r.Name,
      Image: r.Image,
      Price: r.Price,
      "Exact Category": r["Exact Category"],
      Quantity: r.Quantity,
    }));
    res.json(lite);
  } catch (err) {
    res.status(500).json({ message: "Suggest failed", error: err.message });
  }
});

// GET /api/products/meta/categories -> distinct categories for filters
router.get("/meta/categories", async (req, res) => {
  try {
    const cats = await Product.distinct("Exact Category");
    res.json(cats.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: "Failed", error: err.message });
  }
});

// GET /api/products/meta/index-status -> debug helper: is the search index loaded?
router.get("/meta/index-status", (req, res) => {
  res.json(getIndexMeta());
});

// POST /api/products/reindex -> force-rebuild the in-memory search index
// (e.g. call this once after running the excel import script, if you
// don't want to restart the server)
router.post("/reindex", async (req, res) => {
  try {
    const count = await rebuildIndex();
    res.json({ message: "Search index rebuilt", count });
  } catch (err) {
    res.status(500).json({ message: "Reindex failed", error: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid id" });
  }
});

// POST /api/products  -> body can contain ANY columns, fixed or custom
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    rebuildIndex().catch((e) => console.error("[SearchIndex] rebuild after create failed:", e.message));
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: "Failed to create product", error: err.message });
  }
});

// PUT /api/products/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Not found" });
    rebuildIndex().catch((e) => console.error("[SearchIndex] rebuild after update failed:", e.message));
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update product", error: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    rebuildIndex().catch((e) => console.error("[SearchIndex] rebuild after delete failed:", e.message));
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete product", error: err.message });
  }
});

module.exports = router;
