import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";  
import clientPromise from "@/lib/mongodb";

export async function GET(req,{params}) {
		try {
				const session = await getServerSession(authOptions);
	

				if (!session) {
						return NextResponse.json(
								{ message: "Unauthorized" },
								{ status: 401 }
						);
				}

	   const {salesmenid} = await params;

				const client = await clientPromise;
				const db = client.db(process.env.MONGODB_DB); // Uses the database from MONGODB_URI

				const user = await db.collection("users").findOne(
						{ _id: new ObjectId(salesmenid) },
						{ projection: { password: 0 } }
				);


				

				if (!user) {

						return NextResponse.json(
								{ message: "User not found" },
								{ status: 404 }
						);
				}

				let loans = [];

			if (user.loans?.length) {
  loans = await db
    .collection("loans")
    .find({
      _id: {
        $in: user.loans.map((id) => new ObjectId(id)),
      },
      removeMark: { $ne: true },
    })
    .toArray();
}



				return NextResponse.json({
						success: true,
						user,
						loans,
				});
		} catch (error) {
				console.error(error);

				return NextResponse.json(
						{
								success: false,
								message: "Internal Server Error",
						},
						{ status: 500 }
				);
		}
}



export async function DELETE(req, { params }) {
  try {
    const { salesmenid } = await params;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Delete salesman
    const userResult = await db.collection("users").deleteOne({
      _id: new ObjectId(salesmenid),
    });

    // Delete all loans of that salesman
    const loanResult = await db.collection("loans").deleteMany({
      salesmanID: salesmenid, // or new ObjectId(salesmenid) if stored as ObjectId
    });

    return NextResponse.json({
      success: true,
      message: "Deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete.",
      },
      { status: 500 }
    );
  }
}