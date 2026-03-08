import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("fantasy");

  const teams = await db
    .collection("teams")
    .aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          teamName: 1,
          points: 1,
          username: "$user.username",
        },
      },
    ])
    .toArray();

  return NextResponse.json({ teams });
}
