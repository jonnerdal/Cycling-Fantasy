import clientPromise from "../lib/mongodb";
import fs from "fs";

async function main() {
  const data = JSON.parse(fs.readFileSync("riders.json", "utf-8"));
  const client = await clientPromise;
  const db = client.db("fantasy");

  // Insert riders into the collection
  await db.collection("riders").insertMany(data);
  console.log(`Inserted ${data.length} riders`);
  process.exit(0);
}

main().catch(console.error);
