// scripts/upsertRiders.js
const clientPromise = require("../lib/mongodb").default;
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const client = await clientPromise;
    const db = client.db("fantasy");
    const ridersCollection = db.collection("riders");

    // Adjust path if your scripts folder is inside project root
    const filePath = path.join(__dirname, "riders.json");
    if (!fs.existsSync(filePath)) {
      console.error("❌ riders.json file not found at", filePath);
      process.exit(1);
    }

    const fileData = fs.readFileSync(filePath, "utf-8");
    const riders = JSON.parse(fileData);

    let inserted = 0;
    let updated = 0;

    for (const rider of riders) {
      // Check if rider already exists by name + team_code
      const result = await ridersCollection.updateOne(
        { name: rider.name, team_code: rider.team_code },
        { $set: rider },
        { upsert: true } // insert if not exists
      );

      if (result.upsertedCount > 0) inserted++;
      else if (result.modifiedCount > 0) updated++;
    }

    console.log(`✅ Riders processed. Inserted: ${inserted}, Updated: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error upserting riders:", err);
    process.exit(1);
  }
}

main();