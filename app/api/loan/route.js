import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";  
import { v2 as cloudinary } from "cloudinary";
import { ObjectId } from "mongodb";



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


async function uploadImage(file, folder) {
  if (!file || typeof file.arrayBuffer !== "function") {
    return null;
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
}



export async function POST(req) {
  try {
    const session=await getServerSession(authOptions)
    if(!session){
        return NextResponse.json(
      {
        success: false,
        message: "error.message",
      },
      { status: 400 }
    );
    }
   const formData = await req.formData();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB); // Your database name

    const collection = db.collection("loans");

    // Find last customer
    const lastLoan = await collection.findOne(
      {},
      {
        sort: { customerId: -1 },
      }
    );

    const customerId = lastLoan
      ? lastLoan.customerId + 1
      : 3001;
      

  // Get files from request
const productPhoto = formData.get("productPhoto");
const customerIdProof = formData.get("customerIdProof");

let productPhotoUrl = null;
let customerIdProofUrl = null;

// Upload Product Photo
if (
  productPhoto &&
  productPhoto !== "null" &&
  typeof productPhoto.arrayBuffer === "function"
) {
  productPhotoUrl = await uploadImage(
    productPhoto,
    "emi-app/product-photo"
  );
}

// Upload Customer ID Proof
if (
  customerIdProof &&
  customerIdProof !== "null" &&
  typeof customerIdProof.arrayBuffer === "function"
) {
  customerIdProofUrl = await uploadImage(
    customerIdProof,
    "emi-app/customer-proof"
  );
}


const numberOfEmi = Number(formData.get("numberOfEmi"));
const emiAmount = Number(formData.get("emiAmount"));
const emiDate = Number(formData.get("emiDate"));
const totalLoanAmount=emiAmount * numberOfEmi

const emiStartMonth = Number(formData.get("emiStartMonth")); // 1-12
const emiStartYear = Number(formData.get("emiStartYear"));

const firstDueDate = new Date(
  emiStartYear,
  emiStartMonth - 1, // JavaScript months are 0-based
  emiDate
);

const payments = [];

for (let i = 0; i < numberOfEmi; i++) {
  const dueDate = new Date(firstDueDate);
  dueDate.setMonth(firstDueDate.getMonth() + i);

  payments.push({
    emiNo: i + 1,
    dueDate,
    amount: emiAmount,

    status: "Pending",
    paidDate: null,

    fine: 200,
    finePaid: false,
    removeMark: false,
  });
}
  

    const loan = {
      customerId:customerId,
      customerName: formData.get("customerName"),
      mobile: formData.get("mobile"),
      altMobile: formData.get("altMobile"),
      productName: formData.get("productName"),
      address: formData.get("address"),
      productPrice: Number(formData.get("productPrice")),
      downPayment: Number(formData.get("downPayment")),
      financeAmount: Number(formData.get("financeAmount")),
      emiAmount: Number(formData.get("emiAmount")),
      numberOfEmi: Number(formData.get("numberOfEmi")),
      emiDate: formData.get("emiDate"),
      
      productPhoto: productPhotoUrl,
      customerIdProof: customerIdProofUrl,
      salesmanName:session.user.name,
      salesmanID:session.user.id,

       status: "Active",

  // Payment Summary
  totalPaid: 0,
  totalLoanAmount,
  paidEmi: 0,
 remainingEmi: numberOfEmi,

  // Fine Summary
  fineAmount: 0,
  fineCount: 0,

  // EMI Schedule
  payments,
  emiStartMonth,
  emiStartYear,
      createdAt: new Date(),
    };

    

  const usersCollection = db.collection("users");

const result = await collection.insertOne(loan);

// Add loan id to logged-in user
await usersCollection.updateOne(
  { _id: new ObjectId(session.user.id) },
  {
    $push: {
      loans: result.insertedId,
    },
  }
);

    return NextResponse.json({
      success: true,
      message: "Loan Added Successfully",
       loanId: loan.customerId,
    });
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}