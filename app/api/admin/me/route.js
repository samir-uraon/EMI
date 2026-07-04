import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route"  
import clientPromise from "@/lib/mongodb";

export async function GET() {
		try {
				const session = await getServerSession(authOptions);
	

				if (!session) {
						return NextResponse.json(
								{ message: "Unauthorized" },
								{ status: 401 }
						);
				}

				const client = await clientPromise;
				const db = client.db(process.env.MONGODB_DB); // Uses the database from MONGODB_URI


				let loans = [];

		
		loans = await db
  .collection("loans")
  .find({})
  .toArray();

    const salesmen = await db.collection("users").find({}).toArray();
				

				return NextResponse.json({
						success: true,
						salesmen,
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


export async function POST(req) {
		try {
				const session = await getServerSession(authOptions);

				if (!session) {
						return Response.json(
								{ success: false, message: "Unauthorized" },
								{ status: 401 }
						);
				}

				const { action, customerId } = await req.json();

				if (action !== "removeLoan") {
						return Response.json(
								{ success: false, message: "Invalid action" },
								{ status: 400 }
						);
				}

				const client = await clientPromise;
				const db = client.db(process.env.MONGODB_DB);

				// Find loan
				const loan = await db.collection("loans").findOne({
						customerId: Number(customerId),
				});

				if (!loan) {
						return Response.json(
								{ success: false, message: "Loan not found" },
								{ status: 404 }
						);
				}


				

				// Remove loan id from user's loan array
				await db.collection("users").updateOne(
						{
							_id:new ObjectId(loan.salesmanID),
						},
						{
								$pull: {
										loans: loan._id,
								},
						}
				);

				await db.collection("loans").deleteOne({ _id: loan._id });

				return Response.json({
						success: true,
						message: "Loan removed successfully",
				});
		} catch (error) {
				return Response.json(
						{
								success: false,
								message: error.message,
						},
						{ status: 500 }
				);
		}
}