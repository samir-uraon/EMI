import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { fullName, email, password,phone } = await req.json();

    // Validate input
    if (!fullName || !email || !password || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already registered.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await usersCollection.insertOne({
      name:fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,

      // Store Loan Collection IDs
      loans: [],
  
      verified: true,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        userId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error.",
      },
      { status: 500 }
    );
  }
}