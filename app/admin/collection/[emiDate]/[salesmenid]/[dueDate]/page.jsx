"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";

export default function CustomerCollectionDashboard() {
  const router = useRouter();
  const params = useParams();

  // Extract parameters from your dynamic routes
  const emiDateParam = params?.emiDate;
  const salesmanIdParam = params?.salesmenid;
  const dueDate = params?.dueDate;
  const [salesmenName, setSalesmenName] = useState("");
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  const isAdmin = session?.user?.email === "admin@Goldy";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]); // Array layout: [[dueDate, row], ...]

  useEffect(() => {
    if (status === "authenticated" && isAdmin && emiDateParam) {
      fetchCustomerData();
    }
  }, [status, isAdmin, emiDateParam]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/collection/${emiDateParam}/${salesmanIdParam || ""}?dueDate=${dueDate || ""}`);
      const result = await res.json();

      if (result.success && result.data) {
        setSalesmenName(result.salesmenName);
        setData(Object.entries(result.data));
      }
    } catch (error) {
      toast.error("Error fetching customer collection data");
    } finally {
      setLoading(false);
    }
  };

  // Compute metrics dynamically across all customer balances in the snapshot array
  const grandTotals = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let expected = 0;
    let taken = 0;

    data.forEach(([_, row]) => {
      cash += row.cash || 0;
      upi += row.upi || 0;
      expected += row.expected || 0;
      taken += row.taken || 0;
    });

    return {
      cash,
      upi,
      expected,
      taken,
      collected: cash + upi,
    };
  }, [data]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return isNaN(new Date(dateStr).getTime())
      ? dateStr
      : new Date(dateStr)?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Top Header Panel */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex items-center justify-between gap-3">
          <button
            onClick={() => router.push(isAdmin ? `/admin/collection/${emiDateParam}/${salesmanIdParam}` : "/")}
            className="flex items-center gap-1 bg-slate-300 hover:bg-slate-500 text-gray-700 px-3 py-2 rounded-lg transition text-xs font-semibold shadow shrink-0"
          >
            ← Back
          </button>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Salesman Identity</span>
            <h1 className="text-sm sm:text-base font-bold text-gray-950 capitalize leading-tight">
              {salesmenName ? salesmenName : "Loading..."}
            </h1>
            <span className="text-xs text-gray-500 font-medium mt-0.5">
              {dueDate ? formatDate(dueDate) : "Loading..."}
            </span>
          </div>
        </div>

        {/* Global Metric Breakdown Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4">
          <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Total Cash</span>
            <span className="text-sm sm:text-lg font-bold text-gray-900 mt-0.5 block font-mono">₹{grandTotals.cash?.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Total UPI</span>
            <span className="text-sm sm:text-lg font-bold text-gray-900 mt-0.5 block font-mono">₹{grandTotals.upi?.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
            <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider block">Gross Collected</span>
            <span className="text-sm sm:text-lg font-bold text-green-700 mt-0.5 block font-mono">₹{grandTotals.collected?.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xs">
            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block">Total Taken</span>
            <span className="text-sm sm:text-lg font-bold text-indigo-700 mt-0.5 block font-mono">₹{grandTotals.taken?.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-3 rounded-xl shadow-xs text-white col-span-2 md:col-span-1">
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider block">Net Target Gap</span>
            <span className="text-sm sm:text-lg font-bold mt-0.5 block font-mono">
              {loading ? "..." : `₹${Math.max(0, grandTotals.expected - grandTotals.collected)?.toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>

        {/* Loading States & Fallbacks */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 animate-pulse text-sm">
            Loading customer entries...
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
            No customer interactions recorded for this date.
          </div>
        )}

        {/* Layout Wrapper when Data Exists */}
        {!loading && data.length > 0 && (
          <>
            {/* 1. MOBILE CARDS LIST (Visible on small screens, hidden on md+) */}
            <div className="block md:hidden space-y-2.5">
              {data.flatMap(([dueDateKey, row]) => 
                row.customers.map((customer) => {
                  const isPaid = customer.status === "Paid";
                  const cashPaid = isPaid ? (row.cash || 0) : 0;
                  const upiPaid = isPaid ? (row.upi || 0) : 0;
                  const totalCollected = cashPaid + upiPaid;

                  return (
                    <div 
                      key={`${dueDateKey}-${customer.customerId}`} 
                      className="bg-white border border-gray-200 active:bg-gray-50 rounded-xl p-3.5 shadow-xs space-y-2.5 transition active:scale-[0.99] text-gray-700"
                     
                    >
                      <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-gray-950 capitalize truncate">{customer.customerName || "Unknown Customer"}</span>
                          <span className="text-[10px] font-mono text-gray-600 mt-0.5 cursor-pointer hover:text-blue-600"  onClick={() => router.push(`/customer/${customer.customerId}/payments`)}>ID: {customer.customerId || "N/A"}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {customer.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Cash Paid</span>
                          <span className="font-mono font-medium text-gray-700">₹{cashPaid.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">UPI Paid</span>
                          <span className="font-mono font-medium text-gray-700">₹{upiPaid.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between items-center col-span-2 pt-1 border-t border-dotted border-gray-100">
                          <span className="text-gray-600">Target Amount</span>
                          <span className="font-mono font-semibold text-gray-900">₹{Number(customer.amount || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 mt-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                        <span className="text-xs font-semibold text-gray-600">Total Cleared:</span>
                        <span className="font-mono font-bold text-green-700 text-sm">₹{totalCollected.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 2. DESKTOP LEDGER TABLE (Hidden on mobile screens) */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-200 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <th className="px-6 py-4">Customer ID</th>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Paid Date</th>
                      <th className="px-6 py-4">Cash Paid</th>
                      <th className="px-6 py-4">UPI Paid</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {data.map(([dueDateKey, row]) =>
                      row.customers.map((customer) => {
                        const isPaid = customer.status === "Paid";
                        return (
                          <tr
                            key={`${dueDateKey}-${customer.customerId}`}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/customer/${customer.customerId}/payments`)}
                          >
                            <td className="px-6 py-4 font-mono font-semibold text-gray-500 text-xs">
                              {customer.customerId}
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900 capitalize">
                              {customer.customerName}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {formatDate(customer.paidDate)}
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-600">
                              {isPaid ? `₹${row.cash.toLocaleString("en-IN")}` : "₹0"}
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-600">
                              {isPaid ? `₹${row.upi.toLocaleString("en-IN")}` : "₹0"}
                            </td>
                            <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                              ₹{Number(customer.amount).toLocaleString("en-IN")}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {customer.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}