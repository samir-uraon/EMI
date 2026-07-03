"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import ScrollUp from "@/components/ScrollUp";

export default function LoanDetails() {
  const { customerID } = useParams();
  const router = useRouter();
  
  
  const {data: session, status} = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const isAdmin = session?.user?.email==="admin@Goldy";

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
const [removing, setRemoving] = useState(false);

useEffect(() => {
  if (status === "authenticated" && customerID) {
    fetchLoan();
  }
}, [status, customerID]);


const fetchLoan = async () => {
  try {
    setLoading(true);

    const res = await fetch(`/api/customer/${customerID}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch loan");
      
    }

    setLoan(data.loan);
  } catch (err) {
    router.push("/TotalCustomer");
    toast.error(err.message || "Failed to fetch loan details");
  } finally {
    setLoading(false);
  }
};


const handleRemoveLoan = async () => {
  if (!confirm("Are you sure you want to remove this loan?")) return;

  try {
    setRemoving(true);

    const res = await fetch(isAdmin?"/api/admin/me":"/api/me", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "removeLoan",
        customerId: customerID, // or loan._id
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      isAdmin?router.push("/admin/dashboard"):router.push("/");
       
    }

    toast.success("Loan removed successfully");
    router.push("/TotalCustomer");
  } catch (error) {
          isAdmin?router.push("/admin/dashboard"):router.push("/");

    toast.error(error.message);
  } finally {
    setRemoving(false);
  }
};


const handleGeneratePDF = async () => {
  const formatted = new Date(loan?.createdAt).toLocaleDateString("en-GB");

    const customer = {
      name: loan?.customerName,
      date: formatted,
      product: loan?.productName,
      price: loan?.productPrice,
      downPayment:loan?.downPayment,
      balance: loan?.financeAmount,
      emiAmount:loan?.emiAmount,
      numberOfEmi: loan?.numberOfEmi,

    };

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customer),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "EMI.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Unable to generate PDF");
    }
  };

if (status === "loading" || loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        <p className="text-gray-700 font-medium">Loading...</p>
      </div>
    </div>
  );
}

  // calculations...
  const paidAmount = loan?.paidEmi * loan?.emiAmount;
  const remainingEmi = loan?.numberOfEmi - loan?.paidEmi;
  const remainingAmount = remainingEmi * loan?.emiAmount;
  const progress = (loan?.paidEmi / loan?.numberOfEmi) * 100;

  return (
    <>
    <div className="min-h-screen bg-gray-100 p-6 text-gray-600">
      <div className="max-w-6xl mx-auto space-y-6">
  {/* Back Button */}
    <button
      onClick={() => router.back()}
      className="mb-4 flex items-center shadow gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
    >
      ← Back
    </button>
        <h1 className="text-3xl font-bold text-center text-blue-700">
          Loan Details
        </h1>

        {/* Customer Details */}
      <div className="bg-white rounded-xl shadow p-6">
  <h2 className="text-xl font-bold border-b pb-2 mb-4">
    👤 Customer Details
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Customer Information */}
    <div className="md:col-span-2">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p><b>Customer ID:</b> {loan?.customerId}</p>
          <p><b>Customer Name:</b> {loan?.customerName}</p>
          <p><b>Mobile:</b> {loan?.mobile}</p>
          <p><b>Alternate:</b> {loan?.altMobile || "NA"}</p>

        
          {isAdmin && (
            <div className="flex flex-col gap-2 mt-2 w-50">
            <button className="mt-2 bg-green-600 hover:bg-green-600 text-white py-2 px-2 rounded-lg transition text-md"
              onClick={() => router.push(`/admin/${loan?.salesmanID}/salesmen`)}>
              SalesMen : {loan?.salesmanName}
            </button>
      
            <button className="mt-2 bg-slate-500 hover:bg-slate-600 text-white py-2 px-2 rounded-lg transition text-md"
              onClick={() => handleGeneratePDF()}>
              Generate Form 
            </button>
            </div>
          )}
        </div>

        <div>
          <p className="font-bold mb-2">Address</p>
          <div className="bg-slate-100 rounded-lg p-3 min-h-[100px]">
            {loan?.address}
          </div>
        </div>
      </div>
    </div>

    {/* Customer ID Proof */}
  <div className="flex flex-col items-center">
  <p className="font-bold mb-2">ID Proof</p>

  {loan?.customerIdProof ? (
  <div className="relative group w-52 sm:w-60 rounded-xl">
  <img
    src={loan.customerIdProof}
    alt="Customer ID Proof"
    className="w-full h-72 rounded-xl border object-cover shadow transition-all duration-300 sm:group-hover:brightness-50"
  />

  <div className="absolute inset-0 flex items-center justify-center
                  bg-black/30 sm:bg-transparent
                  opacity-100 sm:opacity-0
                  sm:group-hover:opacity-100
                  transition-opacity duration-300 rounded-xl">
    <a
      href={loan.customerIdProof}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg font-semibold hover:bg-gray-100"
    >
      👁 View
    </a>
  </div>
</div>
  ) : (
    <div className="w-56 h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-gray-500">
      No ID Proof
    </div>
  )}
</div>
  </div>
</div>

        {/* Product Details */}
        <div className="bg-white rounded-xl shadow p-6">

  <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">
    📦 Product Details
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

    {/* Product Image */}
    <div className="flex justify-center items-start">
      {loan?.productPhoto ? (
        <div className="relative group w-68 h-48 mx-auto">
  <img
    src={loan?.productPhoto}
    alt="Product Photo"
    className="w-68 h-48  rounded-xl border object-fit-cover shadow transition-all duration-300 group-hover:brightness-50"
  />

  <div className="absolute inset-0 flex items-center justify-center
                  bg-black/30 sm:bg-transparent
                  opacity-100 sm:opacity-0
                  sm:group-hover:opacity-100
                  transition-opacity duration-300 rounded-xl">
                        <a
      href={loan?.productPhoto}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg font-semibold hover:bg-gray-100"
    >
      👁 View
    </a>
  </div>
</div>
      ) : (
        <div className="w-68 h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
          No Image
        </div>
      )}
    </div>

    {/* Product Information */}
    <div className="md:col-span-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="bg-slate-100 rounded-lg p-4">
          <p className="text-sm text-gray-500">Product Name</p>
          <p className="font-semibold text-slate-800">
            {loan?.productName}
          </p>
        </div>

        <div className="bg-slate-100 rounded-lg p-4">
          <p className="text-sm text-gray-500">Product Price</p>
          <p className="font-semibold text-slate-800">
            ₹{loan?.productPrice.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-slate-100 rounded-lg p-4">
          <p className="text-sm text-gray-500">Down Payment</p>
          <p className="font-semibold text-green-600">
            ₹{loan?.downPayment.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600">Finance Amount</p>
          <p className="text-xl font-bold text-blue-700">
            ₹{loan?.financeAmount.toLocaleString("en-IN")}
          </p>
        </div>

      </div>
    </div>

  </div>

</div>

        {/* Loan Information */}

        <div className="bg-white rounded-xl shadow p-6">

<div className="flex justify-between items-center border-b pb-3 mb-4">
  <h2 className="text-xl font-bold flex items-center gap-2">
    💰 Loan Information
  </h2>

  <div className="flex items-center gap-2">
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        loan?.status === "Completed"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {loan?.status}
    </span>

    {isAdmin && loan?.removeMark && (
      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
        🚫 Deleted
      </span>
    )}
  </div>
</div>
          <div className="grid md:grid-cols-2 gap-4">

            <p><b>EMI Amount:</b> ₹{loan?.emiAmount}</p>

            <p><b>Number Of EMI:</b> {loan?.numberOfEmi}</p>

            <p>
              <b>Total Payable:</b> ₹
              {(loan?.emiAmount * loan?.numberOfEmi).toLocaleString()}
            </p>

            <p><b>EMI Due Date:</b> Every {loan?.emiDate}th</p>

            <p><b>Loan Start Date:</b> {loan?.payments[0]?.dueDate?.split("T")[0].split("-").reverse().join("-")}</p>
{loan?.payments[loan?.payments.length - 1]?.dueDate && loan?.status === "Completed" && (
  <p>
    <b>Loan End Date:</b>{" "}
    {loan?.payments[loan?.payments.length - 1]?.dueDate?.split("T")[0].split("-").reverse().join("-")}
  </p>
)}

          </div>

        </div>

        {/* EMI Progress */}

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-xl font-bold border-b pb-2 mb-4">
            📊 EMI Progress
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">

            <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <p className="text-gray-600">Paid EMI</p>
              <h2 className="text-3xl font-bold text-green-700">
                {loan?.paidEmi}
              </h2>
            </div>

            <div className="bg-red-100 p-4 rounded-lg border border-red-300">
              <p className="text-gray-600">Remaining EMI</p>
              <h2 className="text-3xl font-bold text-red-700">
                {remainingEmi}
              </h2>
            </div>

            <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
              <p className="text-gray-600">Paid Amount</p>
              <h2 className="text-2xl font-bold text-blue-700">
                ₹{paidAmount.toLocaleString()}
              </h2>
            </div>

            <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
              <p className="text-gray-600">Remaining Amount</p>
              <h2 className="text-2xl font-bold text-yellow-700">
                ₹{remainingAmount.toLocaleString()}
              </h2>
            </div>

<div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
  <p className="text-orange-700 font-medium">Number of Fine</p>

  <h2 className="text-3xl font-bold text-orange-600">
    {loan?.fineCount}
  </h2>
</div>

<div className="bg-red-100 p-4 rounded-lg border border-red-300">
  <p className="text-red-700 font-medium">Fine Amount</p>

  <h2 className="text-3xl font-bold text-red-600">
    ₹{loan?.fineAmount.toLocaleString()}
  </h2>
</div>

          </div>

          {/* Progress */}

          <div className="mb-2 flex justify-between">
            <span className="font-medium">Progress</span>
            <span className="font-bold">
              {progress.toFixed(0)}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-5">

            <div
              className="bg-green-600 h-5 rounded-full transition-all"
              style={{
                width: `${progress}%`,
              }}
            ></div>

          </div>


        </div>

        <div className="flex justify-between sm:justify-start flex-row gap-4  items-center">
        <button
  onClick={handleRemoveLoan}
  disabled={removing}
  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
>
  {removing ? "Removing..." : "Remove Loan"}
</button>

<button
  onClick={() => router.push(`/customer/${loan.customerId}/payments`)}
  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
>
  View Payments
</button>
</div>
      </div>
    </div>
    <ScrollUp/>
    </>
  );
}