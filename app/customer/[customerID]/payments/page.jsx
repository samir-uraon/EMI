"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ScrollUp from "@/components/ScrollUp";

export default function PaymentBoard() {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  const [payments, setPayments] = useState([]);
  const [originalPayments, setOriginalPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track manually unlocked rows for historical edits
  const [unlockedRows, setUnlockedRows] = useState({});

  const { customerID } = useParams();

  useEffect(() => {
    if (customerID) {
      fetchPayments();
    }
  }, [customerID, status]);

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
        setUnlockedRows({}); 
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

  // Stable index baseline from database
  const currentEmiIndex = originalPayments.findIndex(
    (payment) => payment.status === "Pending"
  );

  // 1. Active EMI Count: Only count "Pending" up to the current active EMI index


  // 2. Completed EMI Count: Only count paid rows up to the current active EMI index
  const completedBatch = payments.filter((payment, index) => {
    if (payment.status !== "Paid" && payment.status !== "Late") return false;
    return currentEmiIndex === -1 || index <= currentEmiIndex;
  }).length;

    const activeBatch = Number(payments.length-completedBatch)

  const handleChange = (index, field, value) => {
  let updated = [...payments];
  updated[index][field] = value;

  // IF STATUS CHANGES TO PENDING: Reset this row AND all future rows
  if (field === "status" && value === "Pending") {
    updated = updated.map((payment, idx) => {
      if (idx >= index) {
        return {
          ...payment,
          status: "Pending",
          paidDate: "",
          paymentMode: "",
          finePaid: false,
        };
      }
      return payment;
    });
  } else if (field === "status") {
    updated[index].finePaid = value === "Late";
  }

  setPayments(updated);
};

  const isRowChanged = (index) => {
    const current = payments[index];
    const original = originalPayments[index];
    if (!current || !original) return false;

    const currentPaidDate = current.paidDate?.split("T")[0] || "";
    const originalPaidDate = original.paidDate?.split("T")[0] || "";

    return (
      current.status !== original.status ||
      (current.paymentMode || "") !== (original.paymentMode || "") ||
      currentPaidDate !== originalPaidDate ||
      current.remarks !== original.remarks
    );
  };

  const isRowValid = (index) => {
    const payment = payments[index];
    if (!payment) return false;
    
    const currentPaidDate = payment.paidDate?.split("T")[0] || "";

    // 1. If Pending: It is valid immediately because fields are blanked out
    if (payment.status === "Pending") {
      return currentPaidDate.trim() === "" && (payment.paymentMode || "").trim() === "";
    }

    // 2. If Paid or Late: Valid ONLY if BOTH fields are fully selected/filled out
    return (
      (payment.status === "Paid" || payment.status === "Late") &&
      currentPaidDate.trim() !== "" &&
      payment.paymentMode !== undefined &&
      payment.paymentMode.trim() !== ""
    );
  };

  const handleSave = async (index) => {
  try {
    const targetPayment = payments[index];

  

    setLoading(true);

    // Check if saving this row caused a cascade reset to Pending for subsequent rows
    const isResetCascade = targetPayment.status === "Pending";

    const res = await fetch(`/api/customer/${customerID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // If a cascade happened, send the whole payments array to update the database state fully
      body: JSON.stringify({
        payment: targetPayment,
        paymentIndex: index,
        isCascadeUpdate: isResetCascade, 
        allPayments: isResetCascade ? payments : null 
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update payment");
    }

    toast.success(
  `EMI #${targetPayment.emiNo} Updated Successfully`
    );
    
    // Sync the entire local database reflection array state smoothly
    if (isResetCascade) {
      setOriginalPayments(structuredClone(payments));
      setUnlockedRows({}); // Relock everything cleanly since timeline state went backwards
    } else {
      const updatedOriginals = [...originalPayments];
      updatedOriginals[index] = structuredClone(targetPayment);
      setOriginalPayments(updatedOriginals);
      setUnlockedRows((prev) => ({ ...prev, [index]: false }));
    }

  } catch (error) {
    router.push("/TotalCustomer");
    toast.error(error.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

  const toggleEditRow = (index) => {
    setUnlockedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCancel = (index) => {
    const reverted = [...payments];
    reverted[index] = structuredClone(originalPayments[index]);
    setPayments(reverted);

    setUnlockedRows((prev) => ({
      ...prev,
      [index]: false,
    }));
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 shadow bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">💳 Payment Board</h2>
          <p className="text-slate-500 text-sm">Update customer EMI payment details</p>
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
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full min-w-[840px] border-collapse text-left text-sm text-slate-600">
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
                <th scope="col" className="px-4 py-3.5 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments?.map((payment, index) => {
                const isCurrentEmi = currentEmiIndex !== -1 && index === currentEmiIndex;
                const isPastEmi = currentEmiIndex !== -1 && index < currentEmiIndex;
                const isLoanCompleted = currentEmiIndex === -1;
                
                const isRowUnlocked = isCurrentEmi || !!unlockedRows[index];
                const showActionBtn = isCurrentEmi || isPastEmi || isLoanCompleted;

                const rowChanged = isRowChanged(index);
                const rowValid = isRowValid(index);

                return (
                  <tr key={index} className="hover:bg-slate-50/70 transition-colors duration-150">
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">{payment.emiNo}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-500">
                      {payment.dueDate?.split("T")[0].split("-").reverse().join("-")}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        disabled={!isRowUnlocked}
                        value={payment.paidDate?.split("T")[0] || ""}
                        onChange={(e) => handleChange(index, "paidDate", e.target.value)}
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-sm transition focus:outline-none ${
                          !isRowUnlocked
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : "bg-white text-slate-800 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        disabled={!isRowUnlocked}
                        value={payment.status}
                        onChange={(e) => handleChange(index, "status", e.target.value)}
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 ${
                          !isRowUnlocked
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
                    <td className="px-3 py-2">
                      <div className="relative rounded-lg shadow-sm">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400 pointer-events-none">₹</span>
                        <input
                          disabled
                          type="number"
                          readOnly
                          value={payment.status === "Late" ? payment.fine : 0}
                          className="w-full rounded-lg border pl-5 py-1.5 text-sm bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        disabled={!isRowUnlocked}
                        value={payment.paymentMode || ""}
                        onChange={(e) => handleChange(index, "paymentMode", e.target.value)}
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-sm transition ${
                          !isRowUnlocked ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white"
                        }`}
                      >
                        <option value="">Select Mode</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank">Bank</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        disabled={!isRowUnlocked}
                        placeholder="Add remarks..."
                        value={payment.remarks || ""}
                        onChange={(e) => handleChange(index, "remarks", e.target.value)}
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-sm transition focus:outline-none ${
                          !isRowUnlocked
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : "bg-white text-slate-800 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {showActionBtn ? (
                        isRowUnlocked ? (
                          <div className="flex flex-col gap-1">
                            <button
                              disabled={!rowChanged || !rowValid}
                              onClick={() => handleSave(index)}
                              className={`w-full py-1.5 rounded text-xs font-semibold tracking-wide transition border ${
                                rowChanged && rowValid
                                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm"
                                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              }`}
                            >
                              💾 Save
                            </button>
                            {!isCurrentEmi && (
                              <button
                                onClick={() => handleCancel(index)}
                                className="w-full py-1.5 rounded text-xs font-semibold tracking-wide transition border bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300 shadow-sm"
                              >
                                ❌ Cancel
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleEditRow(index)}
                            className="w-full py-1.5 rounded text-xs font-semibold tracking-wide transition border bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300 shadow-sm"
                          >
                            🔓 Edit
                          </button>
                        )
                      ) : (
                        <span className="text-xs font-medium text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Grid View */}
      <div className="md:hidden space-y-4 text-slate-500">
        {payments.map((payment, index) => {
          const isCurrentEmi = currentEmiIndex !== -1 && index === currentEmiIndex;
          const isPastEmi = currentEmiIndex !== -1 && index < currentEmiIndex;
          const isLoanCompleted = currentEmiIndex === -1;
          
          const isRowUnlocked = isCurrentEmi || !!unlockedRows[index];
          const showActionBtn = isCurrentEmi || isPastEmi || isLoanCompleted;

          const rowChanged = isRowChanged(index);
          const rowValid = isRowValid(index);

          return (
            <div key={index} className="bg-white rounded-xl shadow border p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-slate-800">EMI #{payment.emiNo}</h3>
                <div className="flex items-center gap-2">
                  {showActionBtn ? (
                    isRowUnlocked ? (
                      <div className="flex gap-2">
                        <button
                          disabled={!rowChanged || !rowValid}
                          onClick={() => handleSave(index)}
                          className={`px-3 py-1 rounded text-xs font-semibold border transition ${
                            rowChanged && rowValid
                              ? "bg-blue-600 text-white border-blue-700"
                              : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          }`}
                        >
                          Save
                        </button>
                        {!isCurrentEmi && (
                          <button
                            onClick={() => handleCancel(index)}
                            className="px-3 py-1 rounded text-xs font-semibold border transition bg-rose-100 text-rose-700 border-rose-300"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleEditRow(index)}
                        className="px-3 py-1 rounded text-xs font-semibold border transition bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300 shadow-sm"
                      >
                        Edit
                      </button>
                    )
                  ) : null}
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
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <input
                    type="date"
                    readOnly
                    disabled
                    value={payment.dueDate?.split("T")[0] || ""}
                    className="w-full rounded-lg border p-2 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Paid Date</label>
                  <input
                    type="date"
                    disabled={!isRowUnlocked}
                    value={payment.paidDate?.split("T")[0] || ""}
                    onChange={(e) => handleChange(index, "paidDate", e.target.value)}
                    className={`w-full rounded-lg border p-2 ${
                      !isRowUnlocked ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    disabled={!isRowUnlocked}
                    value={payment.status}
                    onChange={(e) => handleChange(index, "status", e.target.value)}
                    className={`w-full rounded-lg border p-2 ${
                      !isRowUnlocked
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
                <div>
                  <label className="text-sm font-medium">Fine</label>
                  <input
                    type="number"
                    disabled
                    readOnly
                    value={payment.status === "Late" ? payment.fine : 0}
                    className="w-full rounded-lg border p-2 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Mode</label>
                  <select
                    disabled={!isRowUnlocked}
                    value={payment.paymentMode || ""}
                    onChange={(e) => handleChange(index, "paymentMode", e.target.value)}
                    className={`w-full rounded-lg border p-2 ${
                      !isRowUnlocked ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white border-slate-300"
                    }`}
                  >
                    <option value="">Select Mode</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Remarks</label>
                  <input
                    type="text"
                    disabled={!isRowUnlocked}
                    value={payment.remarks || ""}
                    onChange={(e) => handleChange(index, "remarks", e.target.value)}
                    className={`w-full rounded-lg border p-2 ${
                      !isRowUnlocked ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white border-slate-300"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ScrollUp />
    </div>
  );
}