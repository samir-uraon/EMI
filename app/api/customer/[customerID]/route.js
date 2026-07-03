import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";  
 

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




export async function POST(req,{params}) {
  try {

const session = await getServerSession(authOptions);

if (!session) {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
}

    const {  payments,currentEmiIndex } = await req.json();
  	const { customerID } = await params;
    
const client = await clientPromise;
const db = client.db(process.env.MONGODB_DB);

    if (!customerID || !payments) {
      return NextResponse.json(
        { message: "customerId and payments are required" },
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

const user = await db.collection("users").findOne({
  email: session.user.email,
});

let isAdmin=false;
  if(session.user.email=="admin@Goldy" && session.user.id==47){
isAdmin=true
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



    // Calculate summary
    const paidPayments = payments.filter((p) => p.status === "Paid" || p.status === "Late");

    const paidEmi = paidPayments.length;
    const remainingEmi = payments.length - paidEmi;

    const totalPaid = paidPayments.reduce(
      (sum, p) => sum + Number(p.amount || p.emiAmount || 0),
      0
    );

  const fineAmount = payments.reduce(
  (sum, p) => sum + (p.finePaid ? Number(p.fine || 0) : 0),
  0
);

    const fineCount = payments.filter((p) => p.finePaid==true).length;

    const status = remainingEmi === 0 ? "Completed" : "Active";


    const result = await db.collection("loans").updateOne(
      { customerId: Number(customerID) },
      {
        $set: {
          payments,
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
      message: "Payments updated successfully",
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