import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"; 

export async function GET() {
  try {

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB); // or client.db("your_database_name")

    const customers = await db.collection("loans").find({}).toArray();
    const salesmen = await db.collection("users").find({}).toArray();

    let totalOutstanding = 0;
    let monthlyEMI = 0;
    let overdueEMI = 0;
    let activeLoans = 0;
				let totalLoanAmount=0;
        let totalFine=0;

    const today = new Date();


  
    

    customers.forEach((customer) => {
        if (customer.status !== "Active" || customer.removeMark) return;
  // Total Loan Amount
  totalLoanAmount += Number(customer.totalLoanAmount || 0);

  // Outstanding Amount
  totalOutstanding +=
    Number(customer.totalLoanAmount || 0) -
    Number(customer.totalPaid || 0);


  // Active Loans
  if (customer.status === "Active" && !customer.removeMark) {
    activeLoans++;
  }


  
  customers.forEach((customer) => {
  if (customer.status !== "Active" || customer.removeMark) return;

  const nextPending = customer.payments?.find(
    (payment) => payment.status === "Pending"
  );

  if (!nextPending) return;

  const dueDate = new Date(nextPending.dueDate);

  if (today >= dueDate) {
    overdueEMI++;
  }
});


});


let monthlyCollection = 0;



customers.forEach((customer) => {
    if (customer.status !== "Active" || customer.removeMark) return;
  customer.payments?.forEach((payment) => {
    if (!payment.paidDate) return;

    const paidDate = new Date(payment.paidDate);

    if (
      paidDate.getMonth() === today.getMonth() &&
      paidDate.getFullYear() === today.getFullYear()
    ) {
      monthlyCollection += Number(payment.amount || 0);
    }
  });
});


customers.forEach((customer) => {
  if (customer.status !== "Active" || customer.removeMark) return;
    customer.payments?.forEach((payment) => {
    if (!payment.finePaid || payment.status === "Pending") return;

    totalFine+=payment.fine||0

      });
});

  // Monthly EMI
  customers.forEach((customer) => {
    if (customer.status !== "Active" || customer.removeMark) return;
  customer.payments?.forEach((payment) => {
    if (!payment.dueDate) return;

    const dueDate = new Date(payment.dueDate);

    if (
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    ) {
      monthlyEMI += Number(payment.amount || 0);
    }
  });
});


let remain=0;

remain=monthlyEMI-monthlyCollection


    return NextResponse.json({
      success: true,
      totalCustomers: customers.length,
      totalSalesman: salesmen.length,
      totalOutstanding,
						totalLoanAmount,
						totalLoans:customers.length,
						completedLoans:customers.length-activeLoans,
            monthlyCollection,
            remain,
      monthlyEMI,
      overdueEMI,
      activeLoans,
      totalFine
    });
  } catch (error) {

    console.log(error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

