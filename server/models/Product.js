const mongoose = require("mongoose");

/**
 * The schema is intentionally "loose":
 *  - The columns that exist in your current excel sheet are declared
 *    explicitly (so they get proper types + are included in the text index).
 *  - strict: false means that whenever a user adds a NEW product from the
 *    website and types a custom field name (e.g. "Brand", "Expiry"), that
 *    field is stored on the document too, even though it isn't declared
 *    below. Nothing is lost, nothing needs a migration.
 */
const ProductSchema = new mongoose.Schema(
  {
    Image: { type: String, default: "" }, // Cloudinary URL
    Name: { type: String, required: true, trim: true },
    "Exact Category": { type: String, trim: true },
    Price: { type: Number },
    "Original Price": { type: Number },
    Quantity: { type: String, trim: true },
    "Sub-Category": { type: String, trim: true },
    Category: { type: String, trim: true },
    "Hindi Name": { type: String, trim: true },
    "Hinglish Name": { type: String, trim: true },
    "Indian Category": { type: String, trim: true },
    "Indian Sub-Category": { type: String, trim: true },
  },
  {
    strict: false, // allow arbitrary extra columns added by the user
    timestamps: true,
    minimize: false,
  }
);

// Weighted full text index -> this is what powers relevance ranking.
// MongoDB's $text search scores documents using a TF-IDF style algorithm;
// giving Name/Hinglish/Hindi the highest weight means a match in the
// product name will always rank above a match buried in a category name.
ProductSchema.index(
  {
    Name: "text",
    "Hinglish Name": "text",
    "Hindi Name": "text",
    "Exact Category": "text",
    "Sub-Category": "text",
    Category: "text",
    "Indian Category": "text",
    "Indian Sub-Category": "text",
    Quantity: "text",
  },
  {
    name: "ProductSearchIndex",
    weights: {
      Name: 10,
      "Hinglish Name": 8,
      "Hindi Name": 8,
      "Exact Category": 5,
      "Sub-Category": 4,
      Category: 3,
      "Indian Category": 3,
      "Indian Sub-Category": 3,
      Quantity: 1,
    },
    default_language: "none", // don't strip Hindi/Hinglish as stop-words
  }
);

module.exports = mongoose.model("Product", ProductSchema);
