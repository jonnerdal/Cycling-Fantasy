const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://jonnerdal:Lavender92807%21@cyclingfantasy.f5zyflt.mongodb.net/fantasy?retryWrites=true&w=majority&appName=CyclingFantasy";

const client = new MongoClient(uri);

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected successfully!");
    const db = client.db("fantasy");
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await client.close();
  }
}

testConnection();