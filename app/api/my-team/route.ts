import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"; // your MongoDB client setup

type Rider = {
  _id: string;
  name: string;
  rider_type: string; // "captain" | "youth"
  team_name: string;
  team_code: string;
  team_jersey: string;
};

type Team = {
  teamName: string;
  riders: (Rider | null)[];
};

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id"); // or from session
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const client = await clientPromise;
  const db = client.db("cycling-fantasy");

  const team = await db.collection("teams").findOne({ userId });

  // If no team exists yet, return empty structure
  return NextResponse.json({
    team: team || { teamName: "", riders: Array(13).fill(null) },
  });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { teamName, riders } = body as Team;

  if (!teamName || !riders || !Array.isArray(riders)) {
    return NextResponse.json({ error: "Invalid team" }, { status: 400 });
  }

  // Ensure team array has 13 slots
  const normalizedRiders = [...riders];
  while (normalizedRiders.length < 13) normalizedRiders.push(null);

  const client = await clientPromise;
  const db = client.db("cycling-fantasy");

  await db.collection("teams").updateOne(
    { userId },
    { $set: { teamName, riders: normalizedRiders } },
    { upsert: true }
  );

  return NextResponse.json({ message: "Team saved successfully!", team: { teamName, riders: normalizedRiders } });
}