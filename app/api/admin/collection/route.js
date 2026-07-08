import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    // 1. Session & Admin Authorization Checks
    const session = await getServerSession(authOptions);
    if (!session || session?.user?.email !== "admin@Goldy") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Database Connection
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Filter updated to cleanly fetch active/non-removed records
    const loans = await db.collection("loans").find({ removeMark: { $ne: true } }).toArray();

    // Overall stats counters
    let cashAmount = 0;
    let upiAmount = 0;
    let cashCount = 0;
    let upiCount = 0;

    const transactions = [];

    // Initialize map structures for date-specific aggregation dynamically
    const allowedDays = ["1", "11", "21"];
    const dateStatsMap = {};
    const loanCountMap = {};
    // NEW: Track collections per allowed day
    const dateCollectionsMap = {};

    allowedDays.forEach((day) => {
      loanCountMap[day] = 0;
      dateCollectionsMap[day] = { amount: 0, count: 0 }; // Initialize for breakdown
      dateStatsMap[day] = {
        cashAmount: 0,
        cashCount: 0,
        upiAmount: 0,
        upiCount: 0,
      };
    });

    const collections = await db.collection("collections").find().toArray();

    let totalPaidAmount = 0;
    let totalTaken = 0;
    let totalTakenCount = 0;

    // Total paid by customers (from loans)
    loans.forEach((loan) => {
      totalPaidAmount += Number(loan.totalPaid || 0);
    });

    // Total taken/collected (from collections) + Dynamic Day Breakdowns
    collections.forEach((item) => {
      const amount = Number(item.amount || 0);
      totalTaken += amount;
      
      // Map collection item to its respective day (e.g., matching "1", "11", or "21")
      // NOTE: Change 'item.emiDate' to match whatever field stores the day in your collection schema
      const collectionDayStr = String(item.emiDate || ""); 
      
      if (allowedDays.includes(collectionDayStr)) {
        dateCollectionsMap[collectionDayStr].amount += amount;
        dateCollectionsMap[collectionDayStr].count += 1;
      }
    });

    totalTakenCount = collections.length;

    // 3. Single-Pass Execution ($O(N)$ efficiency)
    loans.forEach((loan) => {
      const loanDayStr = String(loan.emiDate);
      
      // If this loan falls under the tracked target days, increment count
      if (allowedDays.includes(loanDayStr)) {
        loanCountMap[loanDayStr]++;
      }

      if (!Array.isArray(loan.payments)) return;

      loan.payments.forEach((payment) => {
        // Only target processed "Paid" EMIs
        if (payment.status !== "Paid" || payment.removeMark) return;

        // Calculate combined payment amount (Base Amount + Fine if paid)
        let amount = Number(payment.amount || 0);
        if (payment.finePaid) {
          amount += Number(payment.fine || 0);
        }

        // Aggregate Globally
        if (payment.paymentMode === "Cash") {
          cashAmount += amount;
          cashCount++;
        } else if (payment.paymentMode === "UPI") {
          upiAmount += amount;
          upiCount++;
        }

        // Aggregate on targeted date metrics simultaneously (removes nested loops entirely)
        if (allowedDays.includes(loanDayStr)) {
          const targetDayData = dateStatsMap[loanDayStr];
          if (payment.paymentMode === "Cash") {
            targetDayData.cashAmount += amount;
            targetDayData.cashCount++;
          } else if (payment.paymentMode === "UPI") {
            targetDayData.upiAmount += amount;
            targetDayData.upiCount++;
          }
        }

        // Restructure transaction log schema mapping
        transactions.push({
          loanId: loan._id,
          customerId: loan.customerId,
          customerName: loan.customerName,
          mobile: loan.mobile,
          productName: loan.productName,
          salesmanName: loan.salesmanName,
          emiDate: loan.emiDate, 
          emiNo: payment.emiNo,
          amount: payment.amount,
          fine: payment.fine || 0,
          totalAmount: amount,
          paymentMode: payment.paymentMode,
          paidDate: payment.paidDate,
          dueDate: payment.dueDate,
          remarks: payment.remarks || "",
        });
      });
    });

    // 4. Chronological Sort (Latest payments first)
    transactions.sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));

    // 5. Structure the requested `dates` arrays output dynamically
    const dates = allowedDays.map((day) => {
      const metrics = dateStatsMap[day];
      const collectionMetrics = dateCollectionsMap[day]; // Extract day-specific collection numbers
      
      return {
        day,
        loanCount: loanCountMap[day],
        cashAmount: metrics.cashAmount,
        cashCount: metrics.cashCount,
        upiAmount: metrics.upiAmount,
        upiCount: metrics.upiCount,
        totalAmount: metrics.cashAmount + metrics.upiAmount,
        totalPayments: metrics.cashCount + metrics.upiCount,
        totalTaken: collectionMetrics.amount,       // <-- Added day specific total taken
        totalTakenCount: collectionMetrics.count,   // <-- Added day specific count
      };
    });

    // 6. Final API Payload
    return NextResponse.json({
      success: true,
      stats: {
        cash: { amount: cashAmount, count: cashCount },
        upi: { amount: upiAmount, count: upiCount },
        totalTaken,
        totalTakenCount
      },
      transactions,
      dates,
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}