// scripts/updateRiderPrices.ts
const clientPromise = require("../lib/mongodb").default;
const fs = require("fs");
const path = require("path");

// Convert "First Last" → "Last First"
function convertName(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length < 2) return name;
  const first = parts[0];
  const last = parts.slice(1).join(" ");
  return `${last} ${first}`;
}

async function main() {
  try {
    const client = await clientPromise;
    const db = client.db("fantasy");
    const ridersCollection = db.collection("riders");

    const filePath = path.join(__dirname, "rider_prices.txt");
    if (!fs.existsSync(filePath)) {
      console.error("❌ rider_prices.txt file not found at", filePath);
      process.exit(1);
    }

    const fileData = fs.readFileSync(filePath, "utf-8");
    
    // Safely map/filter lines to avoid TypeScript errors
    const lines = fileData
      .split("\n")
      .filter((l) => l) // remove undefined / empty lines
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let updated = 0;
    const missing: string[] = [];

    for (const line of lines) {
      const [nameRaw, priceRaw] = line.split(",");
      if (!nameRaw || !priceRaw) continue;

      const originalName = nameRaw.trim();
      const price = Number(priceRaw.trim());
      const mongoName = convertName(originalName);

      const result = await ridersCollection.updateOne(
        { name: mongoName },
        { $set: { price: price } }
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

    process.exit(0);
  } catch (err) {
    console.error("❌ Script error:", err);
    process.exit(1);
  }
}

main();