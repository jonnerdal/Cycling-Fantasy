// scripts/updateRiderPrices.js
"use strict";

const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" }); // load .env.local

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

// Convert "First Last" → "Last First"
function convertName(name) {
  const parts = name.trim().split(" ");
  if (parts.length < 2) return name;
  const first = parts[0];
  const last = parts.slice(1).join(" ");
  return `${last} ${first}`;
}

// Ensure MONGODB_URI exists
if (!process.env.MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}
const uri = process.env.MONGODB_URI;

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("fantasy");
    const ridersCollection = db.collection("riders");

    const filePath = path.join(__dirname, "rider_prices.txt");
    if (!fs.existsSync(filePath)) {
      console.error("❌ rider_prices.txt file not found at", filePath);
      process.exit(1);
    }

    const fileData = fs.readFileSync(filePath, "utf-8");

    // Safely split, trim, and filter lines
    const lines = fileData
      .split("\n")
      .filter((l) => l)       // remove undefined / empty
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let updated = 0;
    const missing = [];

    for (const line of lines) {
      const [nameRaw, priceRaw] = line.split(",");
      if (!nameRaw || !priceRaw) continue;

      const originalName = nameRaw.trim();
      const price = Number(priceRaw.trim());
      const mongoName = convertName(originalName);

      const result = await ridersCollection.updateOne(
        { name: mongoName },
        { $set: { price } }
      );

      if (result.matchedCount === 0) {
        missing.push(`${originalName} → ${mongoName}`);
      } else {
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} riders`);
    if (missing.length > 0) {
      console.log("\n⚠️ Riders not found:");
      missing.forEach((r) => console.log(r));
    }
  } catch (err) {
    console.error("❌ Script error:", err);
  } finally {
    await client.close();
  }
}

main();