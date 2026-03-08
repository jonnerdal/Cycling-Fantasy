// app/api/my-team/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route"; // adjust path if needed

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

// GET handler
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const client = await clientPromise;
  const db = client.db("cycling-fantasy");

  const team = await db.collection("teams").findOne({ userId });

  return NextResponse.json({
    team: team || { teamName: "", riders: Array(13).fill(null) },
  });
}

// POST handler
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await req.json();
  const { teamName, riders } = body as Team;

  if (!teamName || !riders || !Array.isArray(riders)) {
    return NextResponse.json({ error: "Invalid team" }, { status: 400 });
  }

  const normalizedRiders = [...riders];
  while (normalizedRiders.length < 13) normalizedRiders.push(null);

  const client = await clientPromise;
  const db = client.db("cycling-fantasy");

  await db.collection("teams").updateOne(
    { userId },
    { $set: { teamName, riders: normalizedRiders } },
    { upsert: true }
  );

  return NextResponse.json({
    message: "Team saved successfully!",
    team: { teamName, riders: normalizedRiders },
  });
}