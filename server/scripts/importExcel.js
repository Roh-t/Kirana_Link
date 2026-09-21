/**
 * One-time migration: reads your existing excel sheet and inserts every
 * row into MongoDB, keeping ALL columns exactly as they are.
 * After this runs successfully and you've verified the data in MongoDB
 * (e.g. with MongoDB Compass or `mongosh`), you can safely delete the
 * excel file - the website never reads from it again, everything comes
 * from MongoDB from now on.
 *
 * Usage:
 *   1) put your .xlsx file path in .env as EXCEL_FILE_PATH (or pass it
 *      as the first CLI argument)
 *   2) npm run import
 */
require("dotenv").config();
const path = require("path");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function run() {
  const filePath = process.argv[2] || process.env.EXCEL_FILE_PATH;
  if (!filePath) {
    console.error("Provide the excel path via EXCEL_FILE_PATH in .env or as a CLI arg.");
    process.exit(1);
  }

  console.log("Reading:", filePath);
  const workbook = XLSX.readFile(path.resolve(filePath));
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`Found ${rows.length} rows in sheet "${sheetName}"`);

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  // Normalize numeric-looking fields
  const cleaned = rows.map((row) => {
    const doc = { ...row };
    if (doc.Price !== undefined) doc.Price = Number(doc.Price) || 0;
    if (doc["Original Price"] !== undefined)
      doc["Original Price"] = Number(doc["Original Price"]) || 0;
    return doc;
  });

  console.log("Inserting into MongoDB (this may take a moment)...");
  const BATCH = 1000;
  let inserted = 0;
  for (let i = 0; i < cleaned.length; i += BATCH) {
    const batch = cleaned.slice(i, i + BATCH);
    await Product.insertMany(batch, { ordered: false });
    inserted += batch.length;
    console.log(`  ${inserted}/${cleaned.length}`);
  }

  console.log("Ensuring search index exists...");
  await Product.syncIndexes();

  console.log(`Done! Imported ${inserted} products.`);
  console.log("You can now safely delete the excel file - it is not used by the app anymore.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
