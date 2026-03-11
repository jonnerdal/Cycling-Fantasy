// app/api/riders/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {

  try {

    const client = await clientPromise;
    const db = client.db("fantasy");

    const ridersFromDb = await db
      .collection("riders")
      .find({})
      .sort({ price: -1 })
      .toArray();

    const riders = ridersFromDb.map(r => ({

      _id: r._id.toString(),

      name: r.name || "",

      team_name: r.team_name || "",

      team_code: r.team_code || "",

      rider_type: r.rider_type || "captain",

      team_jersey: r.team_code
        ? `/jerseys/${r.team_code}.png`
        : "/jerseys/default.png",

      // ⭐ IMPORTANT: include price
      price: Number(r.price ?? 0)

    }));

    return NextResponse.json({ riders });

  } catch (err) {

    console.error("Error fetching riders:", err);

    return NextResponse.json(
      { riders: [] },
      { status: 500 }
    );

  }

}