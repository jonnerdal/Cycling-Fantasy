import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("fantasy");

    const ridersFromDb = await db
      .collection("riders")
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Map to clean objects for frontend
    const riders = ridersFromDb.map(r => ({
      _id: r._id.toString(),
      name: r.name,
      team_name: r.team_name,
      team_code: r.team_code,
      points: r.points || 0,
      rider_type: r.rider_type || "captain", // default if missing
      // Link to jersey image in /public/jerseys/
      team_jersey: `/jerseys/${r.team_code}.png`,
    }));

    return NextResponse.json({ riders });
  } catch (err) {
    console.error("Error fetching riders:", err);
    return NextResponse.json({ riders: [] }, { status: 500 });
  }
}