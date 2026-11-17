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

    // 2. Setup Current Month Date Range
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // 3. Database Connection
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // --------------------------------------------------
    // Fetch ONLY ACTIVE and NON-REMOVED loans
    // --------------------------------------------------
    const loans = await db
      .collection("loans")
      .find({
        status: "Active",
        removeMark: { $ne: true },
      })
      .toArray();

    // Fetch collections for current month
    const collections = await db
      .collection("collections")
      .find({
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      })
      .toArray();

    // --------------------------------------------------
    // Overall monthly stats
    // --------------------------------------------------
    let cashAmount = 0;
    let upiAmount = 0;
    let cashCount = 0;
    let upiCount = 0;

    let totalExpected = 0;
    let previousMonthDue = 0;

    const transactions = [];

    // --------------------------------------------------
    // Date-specific aggregation
    // --------------------------------------------------
    const allowedDays = ["1", "11", "21"];

    const dateStatsMap = {};
    const loanCountMap = {};
    const dateCollectionsMap = {};

    allowedDays.forEach((day) => {
      loanCountMap[day] = 0;

      dateCollectionsMap[day] = {
        amount: 0,
        count: 0,
      };

      dateStatsMap[day] = {
        cashAmount: 0,
        cashCount: 0,
        upiAmount: 0,
        upiCount: 0,
        expectedAmount: 0,
        previousMonthDue: 0,
      };
    });

    let totalPaidAmount = 0;
    let totalTaken = 0;

    // --------------------------------------------------
    // Current month collections
    // --------------------------------------------------
    collections.forEach((item) => {
      const amount = Number(item.amount || 0);

      totalTaken += amount;

      const collectionDayStr = String(item.emiDate || "");

      if (allowedDays.includes(collectionDayStr)) {
        dateCollectionsMap[collectionDayStr].amount += amount;
        dateCollectionsMap[collectionDayStr].count += 1;
      }
    });

    const totalTakenCount = collections.length;

    // --------------------------------------------------
    // Process ACTIVE loans and their payments
    // --------------------------------------------------
    loans.forEach((loan) => {
      const loanDayStr = String(loan.emiDate);

      // Count active loans for 1, 11 and 21
      if (allowedDays.includes(loanDayStr)) {
        loanCountMap[loanDayStr]++;
      }

      if (!Array.isArray(loan.payments)) return;

      loan.payments.forEach((payment) => {
        // Ignore removed payments
        if (payment.removeMark) return;

        const baseAmount = Number(payment.amount || 0);

        const dueDateObj = payment.dueDate
          ? new Date(payment.dueDate)
          : null;

        const paidDateObj = payment.paidDate
          ? new Date(payment.paidDate)
          : null;

        // --------------------------------------------------
        // A. CURRENT MONTH EXPECTED
        // --------------------------------------------------
        if (
          dueDateObj &&
          dueDateObj >= startOfMonth &&
          dueDateObj <= endOfMonth
        ) {
          totalExpected += baseAmount;

          if (allowedDays.includes(loanDayStr)) {
            dateStatsMap[loanDayStr].expectedAmount += baseAmount;
          }
        }

        // --------------------------------------------------
        // B. PREVIOUS MONTH DUE
        // --------------------------------------------------
        if (
          dueDateObj &&
          dueDateObj < startOfMonth
        ) {
          const isUnpaid = payment.status !== "Paid";

          const paidAfterStartOfMonth =
            paidDateObj &&
            paidDateObj >= startOfMonth;

          if (isUnpaid || paidAfterStartOfMonth) {
            previousMonthDue += baseAmount;

            if (allowedDays.includes(loanDayStr)) {
              dateStatsMap[loanDayStr].previousMonthDue += baseAmount;
            }
          }
        }

        // --------------------------------------------------
        // Only paid payments below this point
        // --------------------------------------------------
        if (payment.status !== "Paid") return;

        // Base amount + fine
        let totalPaidWithFine = baseAmount;

        if (payment.finePaid) {
          totalPaidWithFine += Number(payment.fine || 0);
        }

        // --------------------------------------------------
        // C. TRANSACTIONS
        // --------------------------------------------------
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
          totalAmount: totalPaidWithFine,
          paymentMode: payment.paymentMode,
          paidDate: payment.paidDate,
          dueDate: payment.dueDate,
          remarks: payment.remarks || "",
        });

        // --------------------------------------------------
        // D. CURRENT MONTH PAID STATS
        // --------------------------------------------------
        if (
          !paidDateObj ||
          paidDateObj < startOfMonth ||
          paidDateObj > endOfMonth
        ) {
          return;
        }

        totalPaidAmount += totalPaidWithFine;

        // Cash
        if (payment.paymentMode === "Cash") {
          cashAmount += totalPaidWithFine;
          cashCount++;
        }

        // UPI
        else if (payment.paymentMode === "UPI") {
          upiAmount += totalPaidWithFine;
          upiCount++;
        }

        // --------------------------------------------------
        // Day-specific paid stats
        // --------------------------------------------------
        if (allowedDays.includes(loanDayStr)) {
          const targetDayData = dateStatsMap[loanDayStr];

          if (payment.paymentMode === "Cash") {
            targetDayData.cashAmount += totalPaidWithFine;
            targetDayData.cashCount++;
          }

          else if (payment.paymentMode === "UPI") {
            targetDayData.upiAmount += totalPaidWithFine;
            targetDayData.upiCount++;
          }
        }
      });
    });

    // --------------------------------------------------
    // Sort transactions - newest first
    // --------------------------------------------------
    transactions.sort(
      (a, b) =>
        new Date(b.paidDate) - new Date(a.paidDate)
    );

    // --------------------------------------------------
    // Build dates array
    // --------------------------------------------------
    const dates = allowedDays.map((day) => {
      const metrics = dateStatsMap[day];
      const collectionMetrics = dateCollectionsMap[day];

      return {
        day,

        // Only ACTIVE loan count
        loanCount: loanCountMap[day],

        // Expected from ACTIVE loans
        expectedAmount: metrics.expectedAmount,

        previousMonthDue: metrics.previousMonthDue,

        cashAmount: metrics.cashAmount,
        cashCount: metrics.cashCount,

        upiAmount: metrics.upiAmount,
        upiCount: metrics.upiCount,

        totalAmount:
          metrics.cashAmount +
          metrics.upiAmount,

        totalPayments:
          metrics.cashCount +
          metrics.upiCount,

        totalTaken: collectionMetrics.amount,
        totalTakenCount: collectionMetrics.count,
      };
    });

    // --------------------------------------------------
    // Final API response
    // --------------------------------------------------
    return NextResponse.json({
      success: true,

      currentMonth: now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),

      stats: {
        totalExpected,
        previousMonthDue,
        totalPaidAmount,
        totalTaken,
        totalTakenCount,

        cash: {
          amount: cashAmount,
          count: cashCount,
        },

        upi: {
          amount: upiAmount,
          count: upiCount,
        },
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