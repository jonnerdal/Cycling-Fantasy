import fs from "fs";
import path from "path";
import clientPromise from "../lib/mongodb";

type RiderPriceUpdate = {
  name: string;
  newPrice: number;
};

async function updateRiderPrices() {
  try {
    // Read the file safely
    const filePath = path.join(process.cwd(), "scripts", "riderPrices.txt");
    const fileData = fs.readFileSync(filePath, "utf-8");

    // Split lines, trim, remove empty lines
    const lines: string[] = fileData
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Convert lines into RiderPriceUpdate objects
    const updates: RiderPriceUpdate[] = lines.map((line) => {
      const [name, priceStr] = line.split(",");
      if (!name || !priceStr) {
        throw new Error(`Invalid line format: "${line}"`);
      }
      const newPrice = Number(priceStr);
      if (isNaN(newPrice)) {
        throw new Error(`Invalid price for rider "${name}": "${priceStr}"`);
      }
      return { name: name.trim(), newPrice };
    });

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("cyclingFantasy");
    const ridersCollection = db.collection("riders");

    // Update each rider
    for (const { name, newPrice } of updates) {
      await ridersCollection.updateOne(
        { name },
        { $set: { price: newPrice } }
      );
    }

    console.log("Rider prices updated successfully!");
  } catch (err) {
    console.error("Failed to update rider prices:", err);
    process.exit(1);
  }
}

// Only run if executed directly
if (require.main === module) {
  updateRiderPrices();
}

export default updateRiderPrices;