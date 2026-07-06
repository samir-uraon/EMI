import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";  
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  try {

  const session = await getServerSession(authOptions);

if (!session) {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
}

const client = await clientPromise;
const db = client.db(process.env.MONGODB_DB);

const { customerID } = await params;
let isAdmin=false;
  if(session.user.email=="admin@Goldy" && session.user.id==47){
isAdmin=true
    }

// Find user
const user = await db.collection("users").findOne({
  email: session.user.email,
});

if (!user && !isAdmin) {
  return NextResponse.json(
    { success: false, message: "User not found" },
    { status: 404 }
  );
}

// Find loan
const loan = await db.collection("loans").findOne({
  customerId: Number(customerID),
});

if(isAdmin){
      return NextResponse.json({
      success: true,
      loan,
    });
}

if (!loan) {
  return NextResponse.json(
    { success: false, message: "Loan not found" },
    { status: 404 }
  );
}





// Check ownership
const hasLoan = user.loans?.some(
  (id) => id.toString() === loan._id.toString()
);




if (!hasLoan) {
  return NextResponse.json(
    { success: false, message: "Loan not found" },
    { status: 403 }
  );
}


    return NextResponse.json({
      success: true,
      loan,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err.message,
    });
  }
}


export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // UPDATED: Expecting a single payment payload and its array index from the frontend
    const { payment, paymentIndex } = await req.json();
    const { customerID } = await params;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Validate parameters (checking for paymentIndex since it can be 0)
    if (!customerID || paymentIndex === undefined || !payment) {
      return NextResponse.json(
        { message: "customerId, payment object, and paymentIndex are required" },
        { status: 400 }
      );
    }

    // Find loan
    const loan = await db.collection("loans").findOne({
      customerId: Number(customerID),
    });

    if (!loan) {
      return NextResponse.json(
        { success: false, message: "Loan not found" },
        { status: 404 }
      );
    }

    // Authentication & Access Controls
    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    let isAdmin = false;
    if (session.user.email === "admin@Goldy" && session.user.id == 47) {
      isAdmin = true;
    }

    if (!user && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check ownership
    const hasLoan = user?.loans?.some(
      (id) => id.toString() === loan._id.toString()
    );

    if (!hasLoan && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Loan not found" },
        { status: 403 }
      );
    }

    // =========================================================================
    // CRITICAL FIX: Build full structural memory list to safely update counts
    // =========================================================================
    let currentPayments = loan.payments || [];
    
    // Safely structure dates for the updated payload element before mutations
    const finalizedPaymentElement = {
      ...payment,
      paidDate: payment.paidDate ? new Date(payment.paidDate) : "",
      dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
    };

    // Replace ONLY the edited EMI inside the localized array setup
    currentPayments[paymentIndex] = finalizedPaymentElement;

    // Recalculate loan metrics based on the safely modified workspace copy
    const paidPayments = currentPayments.filter((p) => p.status === "Paid" || p.status === "Late");

    const paidEmi = paidPayments.length;
    const remainingEmi = currentPayments.length - paidEmi;

    const totalPaid = paidPayments.reduce(
      (sum, p) => sum + Number(p.amount || p.emiAmount || 0),
      0
    );

    const fineAmount = currentPayments.reduce(
      (sum, p) => sum + (p.finePaid ? Number(p.fine || 0) : 0),
      0
    );

    const fineCount = currentPayments.filter((p) => p.finePaid === true).length;
    const status = remainingEmi === 0 ? "Completed" : "Active";

    // Dynamic targeting key pointing to precisely one index slot inside MongoDB
    const targetArrayPath = `payments.${paymentIndex}`;

    // Update only the single array item along with the updated global loan metrics
    const result = await db.collection("loans").updateOne(
      { customerId: Number(customerID) },
      {
        $set: {
          [targetArrayPath]: finalizedPaymentElement, // Updates ONLY this specific row inside the array
          paidEmi,
          remainingEmi,
          totalPaid,
          fineAmount,
          fineCount,
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Loan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `EMI #${payment.emiNo} updated successfully`,
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



export async function PUT(req, { params }) {
  try {
    const { customerID } =await params;
    const body = await req.json();
    

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Get existing loan
				const loan = await db.collection("loans").findOne({
						customerId: Number(customerID),
				});

    if (!loan) {
      return NextResponse.json(
        { message: "Loan not found" },
        { status: 404 }
      );
    }

    let updatedPayments = loan.payments || [];

    // If EMI start date changed, update all due dates
const firstDueDate = new Date(loan.payments[0].dueDate);

const currentDay = firstDueDate.getDate();
const currentMonth = String(firstDueDate.getMonth() + 1).padStart(2, "0");
const currentYear = String(firstDueDate.getFullYear());



if (
  String(body.emiDate) !== String(currentDay) ||
  String(body.emiMonth).padStart(2, "0") !== String(currentMonth) ||
  String(body.emiYear) !== String(currentYear)
) {
  
 
  const startDay = Number(body.emiDate);
  const startMonth = Number(body.emiMonth) - 1; // 0-11
  const startYear = Number(body.emiYear);

 updatedPayments = loan.payments.map((payment, index) => {
const dueDate = new Date(
  Date.UTC(
    startYear,
    startMonth + index,
    startDay
  )
);

    return {
      ...payment,
      dueDate,
    };
  });

  body.payments = updatedPayments;
}

    await db.collection("loans").updateOne(
      {customerId: Number(customerID) },
      {
        $set: {
          ...body,
          payments: updatedPayments,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Loan updated successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}