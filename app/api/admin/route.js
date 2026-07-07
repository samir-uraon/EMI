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

    // Single-pass loop through all customers
    customers.forEach((customer) => {
      if (customer.status !== "Active" || customer.removeMark) return;

      activeLoans++;
      totalLoanAmount += Number(customer.totalLoanAmount || 0);
      totalOutstanding += Number(customer.totalLoanAmount || 0) - Number(customer.totalPaid || 0);

      // Process payments array safely
      if (Array.isArray(customer.payments)) {
        let foundPending = false;

        customer.payments.forEach((payment) => {
          // 1. Calculate Overdue EMIs (Only checks the first pending payment found)
          if (!foundPending && payment.status === "Pending") {
            foundPending = true; 
            if (payment.dueDate) {
              const dueDate = new Date(payment.dueDate);
              if (today >= dueDate) {
                overdueEMI++;
              }
            }
          }

          // 2. Calculate Monthly Collection (based on paid date)
          if (payment.paidDate) {
            const paidDate = new Date(payment.paidDate);
            if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
              monthlyCollection += Number(payment.amount || 0);
            }
          }

          // 3. Calculate Total Fines Collected
          if (payment.finePaid && payment.status !== "Pending") {
            totalFine += Number(payment.fine || 0);
          }

          // 4. Calculate Expected Monthly EMI (based on due date)
          if (payment.dueDate) {
            const dueDate = new Date(payment.dueDate);
            if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
              monthlyEMI += Number(payment.amount || 0);
            }
          }
        });
      }
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
