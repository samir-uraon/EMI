"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ScrollUp from "@/components/ScrollUp";

export default function PaymentBoard() {

  const router=useRouter()
  const { status } = useSession({
  required: true,
  onUnauthenticated() {
    router.replace("/login");
  },
});

  const [payments, setPayments] = useState([]);
const [originalPayments, setOriginalPayments] = useState([]);
const [loading, setLoading] = useState(true);

const { customerID } = useParams();

useEffect(() => {
  if (customerID) {
    fetchPayments();
  }
}, [customerID,status]);

const fetchPayments = async () => {
  try {
    setLoading(true);

    const res = await fetch(`/api/customer/${customerID}`);
    const data = await res.json();



    if (data.success) {
  const paymentList = (data.loan?.payments || []).map((payment) => ({
  ...payment,
  paidDate: payment.paidDate || "",
  fine: payment.fine === 0 ? 200 : (payment.fine ?? 200),
  paymentMode: payment.paymentMode || "",
  remarks: payment.remarks || "",
  status: payment.status || "Pending",
 
}));



setPayments(paymentList);
setOriginalPayments(structuredClone(paymentList));
    } else {
      toast.error(data.message);
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch payments");
  } finally {
    setLoading(false);
  }
};

const activeBatch = originalPayments.filter(
  (payment) => payment.status === "Pending"
).length;

const completedBatch = originalPayments.filter(
  (payment) => payment.status === "Paid" || payment.status === "Late"
).length;

const handleChange = (index, field, value) => {
  const updated = [...payments];

  updated[index][field] = value;

  // Automatically update finePaid
  if (field === "status") {
    updated[index].finePaid = value === "Late";
  }

  setPayments(updated);
};
// 1. Is there any change?
const hasChanges = payments.some((payment, index) => {
  const original = originalPayments[index];

  if (!original) return true;

  const currentPaidDate = payment.paidDate?.split("T")[0] || "";
  const originalPaidDate = original.paidDate?.split("T")[0] || "";

  return (
    payment.status !== original.status ||
    payment.paymentMode !== original.paymentMode ||
    currentPaidDate !== originalPaidDate ||
    Number(payment.fine || 0) !== Number(original.fine || 0) ||
    payment.remarks !== original.remarks
  );
});

const allChangedPaymentsValid = payments.every((payment, index) => {
  const original = originalPayments[index];

  if (!original) return true;

  const currentPaidDate = payment.paidDate?.split("T")[0] || "";
  const originalPaidDate = original.paidDate?.split("T")[0] || "";

  const changed =
    payment.status !== original.status ||
    payment.paymentMode !== original.paymentMode ||
    currentPaidDate !== originalPaidDate ||
    Number(payment.fine || 0) !== Number(original.fine || 0) ||
    payment.remarks !== original.remarks;

  // Ignore unchanged rows
  if (!changed) return true;

  // Changed row must have all required fields
  return (
    (payment.status === "Paid" || payment.status === "Late") &&
    currentPaidDate !== "" &&
    payment.paymentMode !== ""
  );
});

const currentEmiIndex = originalPayments.findIndex(
  (payment) => payment.status === "Pending"
);

const showSaveButton =
  activeBatch !== 0 &&
  hasChanges &&
  allChangedPaymentsValid;



  const handleSave = async () => {
  try {
    
    if(payments.every(payment => payment.status === "Paid" || payment.status === "Late")) {
    let con=confirm("After saving changes,Loan will be locked because this is the Last EMI?");
    if(!con) return;
  }

    setLoading(true);
    const res = await fetch(`/api/customer/${customerID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payments
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update payments");
    }

    toast.success("Payments Updated Successfully");
    setOriginalPayments(JSON.parse(JSON.stringify(payments)));
    setLoading(false);
  } catch (error) {
        router.push("/TotalCustomer");
    toast.error(error.message || "Something went wrong");
    setLoading(false);
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


return (
<div className="w-full min-h-screen bg-white p-4 sm:p-6 text-gray-700">
  <div className="mb-9">

  {/* Back Button */}
    <button
      onClick={() => router.push("/TotalCustomer")}
      className=" flex items-center gap-2 shadow bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
    >
      ← Back
    </button>
    </div>
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">

  <div>
    <h2 className="text-2xl font-bold text-slate-800">
      💳 Payment Board
    </h2>

    <p className="text-slate-500 text-sm">
      Update customer EMI payment details
    </p>

    <div className="flex gap-3 mt-3">
      <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
        🟡 Active EMI: {activeBatch}
      </div>

      <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
        🟢 Completed EMI: {completedBatch}
      </div>
    </div>
  </div>

<div className="flex flex-col sm:flex-row gap-x-8 gap-y-4 mt-3 sm:mt-0">
  <button
    onClick={() => router.push(`/customer/${customerID}`)}
    className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold bg-slate-600 hover:bg-slate-700 text-white transition shadow-sm"
  >
    📄 Loan Details
  </button>

  <button
    onClick={handleSave}
    disabled={!showSaveButton}
    className={`w-full sm:w-auto px-6 py-3 rounded-lg shadow font-semibold transition ${
      showSaveButton
        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        : "bg-slate-300 text-slate-500 cursor-not-allowed"
    }`}
  >
    💾 Save Changes
  </button>
</div>
</div>

    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden  hidden md:block">
  {/* Horizontal scroll container for mobile screens */}
  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
    <table className="w-full min-w-[720px] border-collapse text-left text-sm text-slate-600">
      
      {/* Table Header */}
      <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-200">
        <tr>
          <th scope="col" className="px-4 py-3.5 text-center w-16">EMI</th>
          <th scope="col" className="px-4 py-3.5 text-center w-36">Due Date</th>
          <th scope="col" className="px-4 py-3.5 w-44">Paid Date</th>
          <th scope="col" className="px-4 py-3.5 text-center w-32">Amount</th>
          <th scope="col" className="px-4 py-3.5 w-40">Status</th>
          <th scope="col" className="px-4 py-3.5 w-28">Fine</th>
          <th scope="col" className="px-4 py-3.5 w-36">Mode</th>
          <th scope="col" className="px-4 py-3.5">Remarks</th>
        </tr>
      </thead>

      {/* Table Body */}
      <tbody className="divide-y divide-slate-200">
        {payments?.map((payment, index) => {
              const canEdit = index === currentEmiIndex;
              return (
          <tr key={index} className="transition-colors duration-150 hover:bg-slate-50/70">
            
            {/* EMI Number */}
            <td className="px-4 py-3 text-center font-semibold text-slate-900">
              {payment.emiNo}
            </td>

            {/* Due Date */}
            <td className="px-4 py-3 text-center font-medium text-slate-500">
              {payment.dueDate?.split("T")[0].split("-").reverse().join("-")}
            </td>

            {/* Paid Date Input */}
            <td className="px-3 py-2">
            <input
  type="date"
  disabled={!canEdit}
  value={payment.paidDate?.split("T")[0]}
  onChange={(e) => handleChange(index, "paidDate", e.target.value)}
  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm transition focus:outline-none ${
    !canEdit
      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
      : "bg-white text-slate-800 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  }`}
/>
            </td>

            {/* Amount */}
            <td className="px-4 py-3 text-center font-bold text-emerald-600">
              ₹{payment.amount.toLocaleString("en-IN")}
            </td>

            {/* Status Select dropdown */}
            <td className="px-3 py-2">
            <select
  disabled={!canEdit}
  value={payment.status}
  onChange={(e) => handleChange(index, "status", e.target.value)}
  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 ${
    !canEdit
      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
      : payment.status === "Paid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-100 focus:border-emerald-400"
      : payment.status === "Late"
      ? "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-100 focus:border-rose-400"
      : "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-100 focus:border-amber-400"
  }`}
>
  <option value="Pending">🟡 Pending</option>
  <option value="Paid">🟢 Paid</option>
  <option value="Late">🔴 Late</option>
</select>
            </td>

            {/* Fine Input */}
            <td className="px-3 py-2">
              <div className="relative rounded-lg shadow-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400 pointer-events-none">₹</span>
                <input
                disabled={!canEdit}
                  type="number"
                
                  readOnly
                   value={payment.status === "Late" ? payment.fine : 0}
                  onChange={(e) => handleChange(index, "fine", e.target.value)}
                  className={`w-full rounded-lg border pl-5 py-1.5 text-sm transition focus:outline-none ${
                    !canEdit
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-800 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
              </div>
            </td>

            {/* Payment Mode Select */}
            <td className="px-3 py-2">
              <select
  disabled={!canEdit}
  value={payment.paymentMode}
  onChange={(e) => handleChange(index, "paymentMode", e.target.value)}
  className={`w-full rounded-lg border px-2.5 py-1.5 text-sm transition ${
    !canEdit
      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
      : "bg-white"
  }`}
>
  <option value="">Select Mode</option>
  <option value="Cash">Cash</option>
  <option value="UPI">UPI</option>
  <option value="Bank">Bank</option>
</select>
            </td>

            {/* Remarks Input */}
            <td className="px-3 py-2">
              <input
              disabled={!canEdit}
                type="text"
                placeholder="Add remarks..."
                value={payment.remarks}
                onChange={(e) => handleChange(index, "remarks", e.target.value)}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-sm transition focus:outline-none ${
                  !canEdit
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-800 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
            </td>

          </tr>
        )})}
      </tbody>
    </table>
  </div>
</div>


{/* Mobile View */}
<div className="md:hidden space-y-4 text-slate-500">
  {payments.map((payment, index) =>{
     const canEdit = index === currentEmiIndex;
     return   (
    <div
      key={index}
      className="bg-white rounded-xl shadow border p-4" 
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">
          EMI #{payment.emiNo}
        </h3>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            payment.status === "Paid"
              ? "bg-green-100 text-green-700"
              : payment.status === "Late"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {payment.status}
        </span>
      </div>

      <div className="space-y-3">

<div>
  <label className="text-sm font-medium">Due Date</label>
  <input
    type="date"
    readOnly
    disabled={!canEdit}
    value={payment.dueDate?.split("T")[0] || ""}
  
    className={`w-full rounded-lg border p-2 ${
      !canEdit
        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
        : "bg-white border-slate-300"
    }`}
  />
</div>

      {/* Paid Date */}
<div>
  <label className="text-sm font-medium">Paid Date</label>
  <input
    type="date"
    disabled={!canEdit}
    value={payment.paidDate?.split("T")[0] || ""}
    onChange={(e) =>
      handleChange(index, "paidDate", e.target.value)
    }
    className={`w-full rounded-lg border p-2 ${
      !canEdit
        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
        : "bg-white border-slate-300"
    }`}
  />
</div>

{/* Status */}
<div>
  <label className="text-sm font-medium">Status</label>
  <select
    disabled={!canEdit}
    value={payment.status}
    onChange={(e) =>
      handleChange(index, "status", e.target.value)
    }
    className={`w-full rounded-lg border p-2 ${
      !canEdit
        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
        : payment.status === "Paid"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : payment.status === "Late"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-amber-50 text-amber-700 border-amber-200"
    }`}
  >
    <option value="Pending">🟡 Pending</option>
    <option value="Paid">🟢 Paid</option>
    <option value="Late">🔴 Late</option>
  </select>
</div>

{/* Fine */}
<div>
  <label className="text-sm font-medium">Fine</label>
  <input
    type="number"
    disabled={!canEdit}
    readOnly
  value={payment.status === "Late" ? payment.fine : 0}
    className={`w-full rounded-lg border p-2 ${
      !canEdit
        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
        : "bg-gray-100 border-slate-300"
    }`}
  />
</div>

{/* Payment Mode */}
<div>
  <label className="text-sm font-medium">Payment Mode</label>
  <select
    disabled={!canEdit}
    value={payment.paymentMode}
    onChange={(e) =>
      handleChange(index, "paymentMode", e.target.value)
    }
    className={`w-full rounded-lg border p-2 ${
      !canEdit
        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
        : "bg-white border-slate-300"
    }`}
  >
    <option value="">Select Mode</option>
    <option value="Cash">Cash</option>
    <option value="UPI">UPI</option>
    <option value="Bank">Bank</option>
  </select>
</div>

{/* Remarks */}
<div>
  <label className="text-sm font-medium">Remarks</label>
  <input
    type="text"
    disabled={!canEdit}
    value={payment.remarks}
    onChange={(e) =>
      handleChange(index, "remarks", e.target.value)
    }
    className={`w-full rounded-lg border p-2 ${
      !canEdit
        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
        : "bg-white border-slate-300"
    }`}
  />
</div>

      </div>
    </div>
  )})} 
</div>
<ScrollUp />
</div>
  );
}