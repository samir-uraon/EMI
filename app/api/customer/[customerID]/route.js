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

    // UPDATED: Now destructuring isCascadeUpdate and allPayments from the frontend payload
    const { payment, paymentIndex, isCascadeUpdate, allPayments } = await req.json();
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
    // STRUCTURAL RECONCILIATION: Check if update requires whole timeline reset
    // =========================================================================
    let currentPayments = [];
    let updateFields = {};

    if (isCascadeUpdate && Array.isArray(allPayments)) {
      // 1. Process entire cascading layout sequence array map cleanly
      currentPayments = allPayments.map((p) => ({
        ...p,
        paidDate: p.paidDate ? new Date(p.paidDate) : "",
        dueDate: p.dueDate ? new Date(p.dueDate) : undefined,
      }));

      // Set MongoDB payload to overwrite the entire payments array field
      updateFields.payments = currentPayments;
    } else {
      // 2. Fall back to standard single row array element replacement memory mapping
      currentPayments = loan.payments || [];
      
      const finalizedPaymentElement = {
        ...payment,
        paidDate: payment.paidDate ? new Date(payment.paidDate) : "",
        dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
      };

      currentPayments[paymentIndex] = finalizedPaymentElement;
      
      // Target ONLY the exact array path slot for minor performance optimization
      updateFields[`payments.${paymentIndex}`] = finalizedPaymentElement;
    }

    // Recalculate loan metrics over revised timeline sequence structure
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
    const loanStatus = remainingEmi === 0 ? "Completed" : "Active";

    // Populate remaining core global loan operational parameter flags
    updateFields.paidEmi = paidEmi;
    updateFields.remainingEmi = remainingEmi;
    updateFields.totalPaid = totalPaid;
    updateFields.fineAmount = fineAmount;
    updateFields.fineCount = fineCount;
    updateFields.status = loanStatus;
    updateFields.updatedAt = new Date();

    // Push calculations safely up to database collection cluster fields
    const result = await db.collection("loans").updateOne(
      { customerId: Number(customerID) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Loan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isCascadeUpdate 
        ? `EMI #${payment.emiNo} and trailing active metrics rolled back successfully` 
        : `EMI #${payment.emiNo} updated successfully`,
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

const emiCountChanged =
  Number(body.numberOfEMI) !== loan.payments.length;

if (
  String(body.emiDate) !== String(currentDay) ||
  String(body.emiMonth).padStart(2, "0") !== String(currentMonth) ||
  String(body.emiYear) !== String(currentYear) ||
  emiCountChanged
) {
  
  
const emiCount = Number(body.numberOfEmi);

const startDay = Number(body.emiDate);
const startMonth = Number(body.emiMonth) - 1;
const startYear = Number(body.emiYear);

updatedPayments = Array.from({ length: emiCount }, (_, index) => ({
  emiNo: index + 1,
  dueDate: new Date(
    Date.UTC(
      startYear,
      startMonth + index,
      startDay
    )
  ),
  amount: body.emiAmount,
  status: "Pending",
  paidDate: null,
  fine: 0,
  paymentMode: "",
  remarks: "",
}));

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