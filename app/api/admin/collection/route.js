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

    allowedDays.forEach((day) => {
      loanCountMap[day] = 0;
      dateStatsMap[day] = {
        cashAmount: 0,
        cashCount: 0,
        upiAmount: 0,
        upiCount: 0,
      };
    });

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
      return {
        day,
        loanCount: loanCountMap[day],
        cashAmount: metrics.cashAmount,
        cashCount: metrics.cashCount,
        upiAmount: metrics.upiAmount,
        upiCount: metrics.upiCount,
        totalAmount: metrics.cashAmount + metrics.upiAmount,
        totalPayments: metrics.cashCount + metrics.upiCount,
      };
    });

    // 6. Final API Payload
    return NextResponse.json({
      success: true,
      stats: {
        cash: { amount: cashAmount, count: cashCount },
        upi: { amount: upiAmount, count: upiCount },
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