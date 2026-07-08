import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  try {
    const { emiDate } = await params;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const loans = await db
      .collection("loans")
      .find({
        $and: [
          {
            $or: [
              { emiDate: emiDate },
              { emiDate: Number(emiDate) },
              { emiDate: String(emiDate) },
            ],
          },
          { status: "Active" },
          { removeMark: { $ne: true } },
        ],
      })
      .toArray();

    // Get unique salesman IDs
    const salesmanIds = [...new Set(loans.map((loan) => loan.salesmanID))];

    // Fetch only those salesmen
const salesmen = await db.collection("users").find({
  _id: {
    $in: salesmanIds.map((id) => new ObjectId(id)),
  },
}).toArray();



    return NextResponse.json({
      success: true,
      loans,
      salesmen,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}