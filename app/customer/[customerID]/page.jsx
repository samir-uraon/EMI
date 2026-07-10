"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import ScrollUp from "@/components/ScrollUp";

export default function LoanDetails() {
  const { customerID } = useParams();
  const router = useRouter();
const [preview, setPreview] = useState(null);
const [pdfUrl, setPdfUrl] = useState(null);

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  const isAdmin = session?.user?.email === "admin@Goldy";

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

      const res = await fetch(isAdmin ? "/api/admin/me" : "/api/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "removeLoan",
          customerId: customerID,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        isAdmin ? router.push("/admin/dashboard") : router.push("/");
        throw new Error(data.message || "Failed to remove loan");
      }

      toast.success("Loan removed successfully");
      router.push("/TotalCustomer");
    } catch (error) {
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
    downPayment: loan?.downPayment,
    balance: loan?.financeAmount,
    emiAmount: loan?.emiAmount,
    numberOfEmi: loan?.numberOfEmi,
  };

  let loadingToast = toast.loading("Generating PDF Form...");

  try {
    // We send a direct JSON object down to the API route
    const response = await fetch("/api/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", 
        "Accept": "application/pdf",
      },
      body: JSON.stringify({ customer }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to generate PDF on server");
    }

    const blob = await response.blob();
    
    // Fallback strategy designed to force Website2App / Native systems to catch download streams
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      
      const link = document.createElement("a");
      link.href = base64data;
      link.download = `Loan_Form_${(loan?.customerName || "Customer").replace(/\s+/g, "_")}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss(loadingToast);
      toast.success("PDF Downloaded Successfully");
    };

  } catch (error) {
    toast.dismiss(loadingToast);
    toast.error(error.message || "Could not generate PDF");
    console.error("PDF generation error:", error);
  }
};


  const idProofs = Array.isArray(loan?.customerIdProof)
    ? loan?.customerIdProof
    : loan?.customerIdProof
    ? [loan?.customerIdProof]
    : [];

  const productPhotos = Array.isArray(loan?.productPhoto)
    ? loan?.productPhoto
    : loan?.productPhoto
    ? [loan?.productPhoto]
    : [];

  const handleEditCustomer = () => {
    router.push(`/customer/${customerID}/edit`);
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
  const paidAmount = (loan?.paidEmi || 0) * (loan?.emiAmount || 0);
  const remainingEmi = Math.max(0, (loan?.numberOfEmi || 0) - (loan?.paidEmi || 0));
  const remainingAmount = remainingEmi * (loan?.emiAmount || 0);
  const progress = loan?.numberOfEmi ? (loan?.paidEmi / loan?.numberOfEmi) * 100 : 0;

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-6 text-gray-600">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.push("/TotalCustomer")}
            className="mb-4 flex items-center shadow gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
          >
            ← Back
          </button>
          
          <h1 className="text-3xl font-bold text-center text-blue-700">
            Loan Details
          </h1>

          {/* Customer Details */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h2 className="text-xl font-bold">👤 Customer Details</h2>
              <button
                onClick={handleEditCustomer}
                className="flex items-center gap-2 bg-slate-400 hover:bg-slate-500 text-white px-3 py-1 rounded-lg transition"
              >
                EDIT
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-2">
                    <p><b>Customer ID:</b> {loan?.customerId}</p>
                    <p><b>Customer Name:</b> {loan?.customerName}</p>
                  <p>
  <a
    href={`tel:${loan?.mobile}`}
    className="inline-block cursor-pointer transition-all duration-150 active:scale-95 active:opacity-80"
  >
    <span className="font-semibold">Phone:</span> {loan?.mobile}
  </a>
</p>
                    <p><b>Alternate:</b> {loan?.altMobile || "NA"}</p>

                    <div className="flex flex-col gap-2 mt-2 w-52">
                      {isAdmin && (
                        <button
                          className="mt-2 bg-green-600 hover:bg-green-700 text-white py-2 px-2 rounded-lg transition text-md shadow-sm"
                          onClick={() => router.push(`/admin/${loan?.salesmanID}/salesmen`)}
                        >
                          Salesman: {loan?.salesmanName}
                        </button>
                      )}
                      <button
                        className="mt-2 bg-slate-500 hover:bg-slate-600 text-white py-2 px-2 rounded-lg transition text-md shadow-sm"
                        onClick={handleGeneratePDF}
                      >
                        Generate Form
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold mb-2">Address</p>
                    <div className="bg-slate-100 rounded-lg p-3 min-h-[100px]">
                      {loan?.address}
                    </div>
                  </div>
                </div>
              </div>
              {pdfUrl && (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
    <div className="relative w-[95%] h-[95%] bg-white rounded-lg overflow-hidden">
      <button
        onClick={() => {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }}
        className="absolute top-3 right-3 z-10 bg-red-600 text-white px-3 py-1 rounded"
      >
        ✕
      </button>

      <iframe
        src={pdfUrl}
        title="PDF Preview"
        className="w-full h-full"
      />
    </div>
  </div>
)}

              {/* Customer ID Proof */}
            {/* Customer ID Proof */}
<div className="flex flex-col items-center">
  <p className="font-bold mb-4">ID Proof</p>
  {idProofs.length ? (
    <div className={`grid gap-6 ${idProofs.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
      {idProofs.slice(0, 2).map((photo, index) => (
        <div key={index} className="relative group w-36 h-48 bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <img
            src={photo}
            alt={`ID Proof ${index + 1}`}
            className="w-full h-full object-cover transition-all duration-300 brightness-50 sm:brightness-100 sm:group-hover:brightness-50"
          />
          {/* Always visible on mobile (opacity-100), fades in on desktop hover (sm:opacity-0 sm:group-hover:opacity-100) */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 sm:bg-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            <button
  type="button"
  onClick={() => setPreview(photo)}
              className="bg-white text-gray-800 text-xs px-2.5 py-1.5 rounded-md shadow font-semibold hover:bg-gray-100 transition-colors"
            >
              👁 View
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="w-36 h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-medium">
      No ID Proof
    </div>
  )}
</div>
</div>
</div>

          {/* Product Details */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6">📦 Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product Image */}
<div className="flex justify-center items-start">
  {productPhotos.length ? (
    <div className={`grid gap-6 ${productPhotos.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
      {productPhotos.slice(0, 2).map((photo, index) => (
        <div key={index} className="relative group w-44 h-32 bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <img
            src={photo}
            alt={`Product ${index + 1}`}
            className="w-full h-full object-cover transition-all duration-300 brightness-50 sm:brightness-100 sm:group-hover:brightness-50"
          />
          {/* Always visible on mobile (opacity-100), fades in on desktop hover (sm:opacity-0 sm:group-hover:opacity-100) */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 sm:bg-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                    <button
  type="button"
  onClick={() => setPreview(photo)}
              className="bg-white text-gray-800 text-xs px-2.5 py-1.5 rounded-md shadow font-semibold hover:bg-gray-100 transition-colors"
            >
              👁 View
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="w-44 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-medium">
      No Images
    </div>
  )}
</div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Product Name</p>
                    <p className="font-semibold text-slate-800">{loan?.productName}</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Product Price</p>
                    <p className="font-semibold text-slate-800">₹{loan?.productPrice?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Down Payment</p>
                    <p className="font-semibold text-green-600">₹{loan?.downPayment?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600">Finance Amount</p>
                    <p className="text-xl font-bold text-blue-700">₹{loan?.financeAmount?.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">💰 Loan Information</h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${loan?.status === "Completed" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                  {loan?.status}
                </span>
                {isAdmin && loan?.removeMark && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Deleted</span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <p><b>EMI Amount:</b> ₹{loan?.emiAmount}</p>
              <p><b>Number Of EMI:</b> {loan?.numberOfEmi}</p>
              <p><b>Total Payable:</b> ₹{( (loan?.emiAmount || 0) * (loan?.numberOfEmi || 0) ).toLocaleString("en-IN")}</p>
              <p>
                <b>EMI Due Date:</b> Every{" "}
                {loan?.emiDate === 1 || loan?.emiDate === "1"
                  ? "1st"
                  : loan?.emiDate === 11 || loan?.emiDate === "11"
                  ? "11th"
                  : loan?.emiDate === 21 || loan?.emiDate === "21"
                  ? "21st"
                  : `${loan?.emiDate}th`}
              </p>
              <p><b>Loan Start Date:</b> {loan?.payments?.[0]?.dueDate?.split("T")[0].split("-").reverse().join("-") || "NA"}</p>
              {loan?.payments?.[loan?.payments.length - 1]?.dueDate && loan?.status === "Completed" && (
                <p><b>Loan End Date:</b> {loan?.payments[loan?.payments.length - 1]?.dueDate?.split("T")[0].split("-").reverse().join("-")}</p>
              )}
            </div>
          </div>

          {/* EMI Progress */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold border-b pb-2 mb-4">📊 EMI Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                <p className="text-xs text-gray-600 font-medium">Paid EMI</p>
                <h2 className="text-3xl font-bold text-green-700">{loan?.paidEmi}</h2>
              </div>
              <div className="bg-red-100 p-4 rounded-lg border border-red-300">
                <p className="text-xs text-gray-600 font-medium">Remaining EMI</p>
                <h2 className="text-3xl font-bold text-red-700">{remainingEmi}</h2>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                <p className="text-xs text-gray-600 font-medium">Paid Amount</p>
                <h2 className="text-2xl font-bold text-blue-700">₹{paidAmount.toLocaleString("en-IN")}</h2>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
                <p className="text-xs text-gray-600 font-medium">Remaining Amount</p>
                <h2 className="text-2xl font-bold text-yellow-700">₹{remainingAmount.toLocaleString("en-IN")}</h2>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
                <p className="text-xs text-orange-700 font-medium">Number of Fine</p>
                <h2 className="text-3xl font-bold text-orange-600">{loan?.fineCount || 0}</h2>
              </div>
              <div className="bg-red-100 p-4 rounded-lg border border-red-300">
                <p className="text-xs text-red-700 font-medium">Fine Amount</p>
                <h2 className="text-3xl font-bold text-red-600">₹{(loan?.fineAmount || 0).toLocaleString("en-IN")}</h2>
              </div>
            </div>

            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-gray-500">Progress</span>
              <span className="font-bold text-slate-700">{progress.toFixed(0)}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progress)}%` }}
              ></div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end flex-row gap-4 items-center pt-2">
            <button
              onClick={handleRemoveLoan}
              disabled={removing}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium shadow-sm transition"
            >
              {removing ? "Removing..." : "Remove Loan"}
            </button>
            <button
              onClick={() => router.push(`/customer/${customerID}/payments`)}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
            >
              View Payments
            </button>
          </div>
        </div>
        
        {preview && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    onClick={() => setPreview(null)}
  >
    <div className="relative">
      <img
        src={preview}
        alt="Preview"
        className="max-w-[90vw] max-h-[90vh] rounded-lg"
      />

      <button
        type="button"
        onClick={() => setPreview(null)}
        className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded"
      >
        ✕
      </button>
    </div>
  </div>
)}
      </div>
      <ScrollUp />
    </>
  );
}