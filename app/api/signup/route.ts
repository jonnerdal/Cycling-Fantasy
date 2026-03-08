import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("fantasy");

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      // Generic message (don’t tell them which one exists)
      return NextResponse.json(
        { message: "Unable to create account" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Account created" });

  } catch (error) {
    console.error("Signup error:", error); // Log internally only

    // Generic failure response
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
