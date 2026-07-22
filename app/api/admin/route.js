import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"; 


export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Fetch collections concurrently to save time
    const [customers, salesmen] = await Promise.all([
      db.collection("loans").find({}).toArray(),
      db.collection("users").find({}).toArray(),
    ]);

    let totalOutstanding = 0;
    let monthlyEMI = 0;
    let overdueEMI = 0;
    let activeLoans = 0;
    let totalLoanAmount = 0;
    let totalFine = 0;
    let monthlyCollection = 0;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();


today.setHours(0, 0, 0, 0);

// Single-pass loop through all customers
customers.forEach((customer) => {
  if (customer.removeMark) return;

  // Count fine for ALL loans (Active + Completed)
  if (Array.isArray(customer.payments)) {
    customer.payments.forEach((payment) => {
      if (
        payment.finePaid &&
        payment.status?.toLowerCase() !== "pending"
      ) {
        totalFine += Number(payment.fine || 0);
      }
    });
  }

  // Everything below only for Active loans
  if (customer.status !== "Active") return;

  activeLoans++;
  totalLoanAmount += Number(customer.totalLoanAmount || 0);
  totalOutstanding +=
    Number(customer.totalLoanAmount || 0) -
    Number(customer.totalPaid || 0);

  if (!Array.isArray(customer.payments)) return;

  // Find earliest pending EMI
  const nextPending = customer.payments
    .filter(
      (payment) =>
        payment.status?.toLowerCase() === "pending" && payment.dueDate
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  if (nextPending) {
    const dueDate = new Date(nextPending.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate <= today) {
      overdueEMI++;
    }
  }

  customer.payments.forEach((payment) => {
    // Monthly Collection
    if (payment.paidDate) {
      const paidDate = new Date(payment.paidDate);

      if (
        paidDate.getMonth() === currentMonth &&
        paidDate.getFullYear() === currentYear
      ) {
        monthlyCollection += Number(payment.amount || 0);
      }
    }

    // Monthly EMI
    if (payment.dueDate) {
      const dueDate = new Date(payment.dueDate);

      if (
        dueDate.getMonth() === currentMonth &&
        dueDate.getFullYear() === currentYear
      ) {
        monthlyEMI += Number(payment.amount || 0);
      }
    }
  });
});

    const remain = monthlyEMI - monthlyCollection;

    return NextResponse.json({
      success: true,
      totalCustomers: customers.length,
      totalSalesman: salesmen.length,
      totalOutstanding,
      totalLoanAmount,
      totalLoans: customers.length,
      completedLoans: customers.length - activeLoans,
      monthlyCollection,
      remain,
      monthlyEMI,
      overdueEMI,
      activeLoans,
      totalFine,
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
