import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";


// 1. GET Handler
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session?.user?.email !== "admin@Goldy") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { emiDate, salesmenid } = await params;

    if (!salesmenid) {
      return NextResponse.json({ success: false, error: "Missing salesmanId" }, { status: 400 });
    }

    // Extract the dueDate query parameter from the URL (?dueDate=...)
    const { searchParams } = request.nextUrl;
    const targetDueDate = searchParams.get("dueDate");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Get Active Loans
    const loans = await db
      .collection("loans")
      .find({
        salesmanID: salesmenid,
      
        removeMark: { $ne: true },
        $or: [
          { emiDate: emiDate },
          { emiDate: Number(emiDate) },
          { emiDate: String(emiDate) },
        ],
      })
      .toArray();

    // Query recorded "taken amounts" inside collections collection
    const savedCollections = await db
      .collection("collections")
      .find({ salesmenid, emiDate: emiDate })
      .toArray();

    const takenMap = {};
    savedCollections.forEach((col) => {
      if (col.dueDate) {
        takenMap[col.dueDate] = col.amount || 0;
      }
    });

    // Clean Key Map Structure (Using dictionary object structure instead of an array)
    const groupedData = {};

    loans.forEach((loan) => {
      loan.payments?.forEach((payment) => {
        if (!payment.dueDate) return;

        const date = new Date(payment.dueDate);
        // Create an ISO standard date key: YYYY-MM-DD
        const dueDateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        // If a specific dueDate query param is provided, ignore other dates
        if (targetDueDate && dueDateKey !== targetDueDate) return;

        if (!groupedData[dueDateKey]) {
          groupedData[dueDateKey] = {
            cash: 0,
            upi: 0,
            expected: 0,
          
            taken: takenMap[dueDateKey] || 0, // Inject matching recorded taken value
            customers: [],
          };
        }

        groupedData[dueDateKey].expected += Number(payment.amount) || 0;

        if (payment.status === "Paid") {
          if (payment.paymentMode === "Cash") {
            groupedData[dueDateKey].cash += Number(payment.amount) || 0;
          } else if (payment.paymentMode === "UPI") {
            groupedData[dueDateKey].upi += Number(payment.amount) || 0;
          }
        }

        groupedData[dueDateKey].customers.push({
          customerId: loan.customerId,
          customerName: loan.customerName,
          paidDate: payment.paidDate,
          amount: payment.amount,
            mode:payment.paymentMode,
          status: payment.status,
        });
      });
    });

    // Sort map by date keys chronologically
    const sortedGroupedData = Object.fromEntries(
      Object.entries(groupedData).sort(
        ([dateA], [dateB]) => new Date(dateA) - new Date(dateB)
      )
    );

    return NextResponse.json({
      success: true,
      data: sortedGroupedData,
      salesmenName: loans[0]?.salesmanName || "Unknown Salesman" // Safe guard if array is empty
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

 

// 2. POST Handler
export async function POST(request, { params }) {
  try {
    const { emiDate ,salesmenid} = await params;
    const { dueDate, amount} = await request.json();

    if (!dueDate || amount === undefined || !salesmenid) {
      return NextResponse.json(
        { success: false, error: "Missing required properties (dueDate, amount, salesmanId)" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

await db.collection("collections").updateOne(
  {
    dueDate,
    salesmenid,
  },
  {
    $set: {
      emiDate,
      amount: Number(amount),
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
  },
  {
    upsert: true,
  }
);
    return NextResponse.json({
      success: true,
      message: "Ledger recorded successfully",
      saved: { dueDate, amount },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}