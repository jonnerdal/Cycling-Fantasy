const fs = require("fs");
const { MongoClient } = require("mongodb");

// Load your JSON file from the scripts folder
const ridersData = JSON.parse(fs.readFileSync("scripts/riders.json", "utf-8"));

// MongoDB connection
const uri = "mongodb+srv://jonnerdal:cycling_fantasy@cyclingfantasy.f5zyflt.mongodb.net/fantasy?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("fantasy");
    const collection = db.collection("riders");

    // Clean combined riders
    const cleaned = [];
    ridersData.forEach(r => {
      const parts = r.name.split("..").map(p => p.trim());
      parts.forEach(p => {
        if (!p) return;
        cleaned.push({
          name: p.replace(/\d{1,2}:\d{2}/, "").trim(), // remove times like 0:00
          team_name: r.team_name,
          team_code: r.team_code,
          points: r.points || 0,
          rider_type: r.rider_type || "captain",
          team_jersey: `/jerseys/${r.team_code}.png` // assumes jersey files are in /public/jerseys/
        });
      });
    });

    let inserted = 0;
    let updated = 0;

    // Upsert each rider
    for (const rider of cleaned) {
      const result = await collection.updateOne(
        { name: rider.name, team_code: rider.team_code }, // match by name + team
        { $setOnInsert: rider } // only set if inserting, do not overwrite existing
        // use $set instead of $setOnInsert if you want to update existing records
      );

      if (result.upsertedCount > 0) inserted++;
      else updated++; // already existed
    }

    console.log(`Riders upsert complete! Inserted: ${inserted}, Already existed: ${updated}`);
  } catch (err) {
    console.error("Error upserting riders:", err);
  } finally {
    await client.close();
  }
}

run();