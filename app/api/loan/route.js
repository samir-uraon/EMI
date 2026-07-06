import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";  
import { v2 as cloudinary } from "cloudinary";
import { ObjectId } from "mongodb";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload a single image buffer to Cloudinary
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

// Parallel runner for processing arrays of files safely
async function uploadMultipleImages(filesArray, folder) {
  if (!filesArray || !Array.isArray(filesArray) || filesArray.length === 0) {
    return [];
  }

  // Filter out invalid items or "null" strings sent by frontend multi-part forms
  const validFiles = filesArray.filter(
    (file) => file && file !== "null" && typeof file.arrayBuffer === "function"
  );

  // Map to individual upload promises and resolve concurrently
  const uploadPromises = validFiles.map((file) => uploadImage(file, folder));
  const urls = await Promise.all(uploadPromises);
  
  // Clean out null results from any individual file upload failures
  return urls.filter((url) => url !== null);
}

export async function POST(req) {
  try {
    // 1. Session Authentication & Authorization Guard
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const loansCollection = db.collection("loans");
    const usersCollection = db.collection("users");

    // 2. Sequential Customer ID Query (Using requested limit/next strategy)
    const lastLoan = await loansCollection
      .find({})
      .sort({ customerId: -1 })
      .limit(1)
      .next();

    const customerId = lastLoan 
      ? Number(lastLoan.customerId) + 1 
      : 3001;

    // 3. Process Upload Array Queues
    const productPhotos = formData.getAll("productPhoto");
    const customerIdProofs = formData.getAll("customerIdProof");

    const productPhotoUrls = await uploadMultipleImages(productPhotos, "emi-app/product-photos");
    const customerIdProofUrls = await uploadMultipleImages(customerIdProofs, "emi-app/customer-proofs");

    // 4. Financial Calculations and Schedule Engine
    const numberOfEmi = Number(formData.get("numberOfEmi"));
    const emiAmount = Number(formData.get("emiAmount"));
    const emiDate = Number(formData.get("emiDate"));
    const totalLoanAmount = emiAmount * numberOfEmi;

    const emiStartMonth = Number(formData.get("emiStartMonth")); // 1-12 range
    const emiStartYear = Number(formData.get("emiStartYear"));

    const payments = [];

    // Safely generate payment schedule tracking arrays with monthly loops
    for (let i = 0; i < numberOfEmi; i++) {
      // JavaScript Date handles rolling overflow natively (e.g. Month 12 rolls year over)
      const dueDate = new Date(emiStartYear, (emiStartMonth - 1) + i, emiDate);

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

    // 5. Structure Document Payload Schema
    const loan = {
      customerId: customerId,
      customerName: formData.get("customerName"),
      mobile: formData.get("mobile"),
      altMobile: formData.get("altMobile"),
      productName: formData.get("productName"),
      address: formData.get("address"),
      productPrice: Number(formData.get("productPrice")),
      downPayment: Number(formData.get("downPayment")),
      financeAmount: Number(formData.get("financeAmount")),
      emiAmount: emiAmount,
      numberOfEmi: numberOfEmi,
      emiDate: emiDate,
      
      // Saved as URL arrays
      productPhoto: productPhotoUrls,
      customerIdProof: customerIdProofUrls,
      
      salesmanName: session.user.name,
      salesmanID: session.user.id,
      status: "Active",

      // Payment Breakdown Metrics
      totalPaid: 0,
      totalLoanAmount,
      paidEmi: 0,
      remainingEmi: numberOfEmi,

      // Penalty Fine Metrics
      fineAmount: 0,
      fineCount: 0,

      // EMI Schedule
      payments,
      emiStartMonth,
      emiStartYear,
      createdAt: new Date(),
    };

    // 6. Persistence Execution
    const result = await loansCollection.insertOne(loan);

    // Link dynamic MongoDB reference pointer key down to context User document layout
    if (ObjectId.isValid(session.user.id)) {
      await usersCollection.updateOne(
        { _id: new ObjectId(session.user.id) },
        {
          $push: {
            loans: result.insertedId,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Loan Added Successfully",
      loanId: loan.customerId,
    });

  } catch (error) {
    console.error("Backend runtime loan route tracking error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An unexpected system internal error occurred.",
      },
      { status: 500 }
    );
  }
}