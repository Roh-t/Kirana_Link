const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is missing in .env");

    await mongoose.connect(uri);
    console.log("[MongoDB] connected ->", mongoose.connection.name);
  } catch (err) {
    console.error("[MongoDB] connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
