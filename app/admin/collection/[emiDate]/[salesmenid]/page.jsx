"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";

export default function SalesmanTimelineDashboard() {
  const router = useRouter();
  const params = useParams();

  const emiDateParam = params?.emiDate;
  const salesmanIdParam = params?.salesmenid;

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  const isAdmin = session?.user?.email === "admin@Goldy";

  const [loading, setLoading] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [tempInputValue, setTempInputValue] = useState("");
  const [data, setData] = useState({});
  const [salesmenName, setSalesmenName] = useState("");

  useEffect(() => {
    if (status === "authenticated" && isAdmin && emiDateParam) {
      fetchData();
    }
  }, [status, isAdmin, emiDateParam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/collection/${emiDateParam}/${salesmanIdParam}`);
      const result = await res.json();

      if (result.success && result.data) {
        setData(result.data);        
        setSalesmenName(result.salesmenName || "");
      }
    } catch (error) {
      toast.error("Error fetching collection timeline data");
    } finally {
      setLoading(false);
    }
  };

  const grandTotals = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let collected = 0;
    let taken = 0;
    let expected = 0;

    Object.values(data || {}).forEach((row) => {
      cash += row.cash || 0;
      upi += row.upi || 0;
      collected += (row.cash || 0) + (row.upi || 0);
      taken += row.taken || 0;
      expected += row.expected || 0;
    });

    return { cash, upi, collected, taken, expected };
  }, [data]);

  const startEditing = (rowId, currentVal) => {
    setEditingRowId(rowId);
    setTempInputValue(currentVal === 0 ? "" : currentVal.toString());
  };

  const saveRowAmount = async (rowId) => {
    const numericValue = tempInputValue === "" ? 0 : Math.max(0, parseInt(tempInputValue, 10) || 0);
    const previousState = { ...data };

    setData((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        taken: numericValue,
      },
    }));
    setEditingRowId(null);

    try {
      const res = await fetch(`/api/admin/collection/${emiDateParam}/${salesmanIdParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: rowId,
          amount: numericValue,
          salesmanId: salesmanIdParam,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Amount updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save update. Rolling back...");
      setData(previousState);
    }
  };

  const cancelEditing = () => {
    setEditingRowId(null);
  };

  const formatDate = (dateStr) => {
    return isNaN(new Date(dateStr).getTime())
      ? dateStr
      : new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getDayLabel = (dateStr, index) => {
    return isNaN(new Date(dateStr).getDate()) ? `Day ${index + 1}` : `Day ${new Date(dateStr).getDate()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Header Panel */}
        <div className="bg-white border border-gray-200 p-4 sm:p-5 rounded-xl shadow-xs flex items-center justify-between gap-4">
              <button
            onClick={() => router.push(isAdmin ? `/admin/collection/${emiDateParam}` : "/")}
            className="flex items-center gap-1.5 bg-slate-300 hover:bg-slate-400 text-gray-700 px-3 py-2 rounded-lg transition text-xs sm:text-sm font-medium shadow shrink-0"
          >
            ← Back
          </button>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">Salesman Identity</span>
            <h1 className="text-base sm:text-lg font-bold text-gray-950 capitalize">
              {salesmenName ? salesmenName : "Loading..."}
            </h1>
          </div>
      
        </div>

        {/* Global Metric Breakdown Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-xs">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Cash</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 block font-mono">₹{grandTotals.cash.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-xs">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total UPI</span>
            <span className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 block font-mono">₹{grandTotals.upi.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-xs">
            <span className="text-[10px] sm:text-xs font-semibold text-green-600 uppercase tracking-wider block">Gross Collected</span>
            <span className="text-base sm:text-lg font-bold text-green-700 mt-0.5 block font-mono">₹{grandTotals.collected.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-xs">
            <span className="text-[10px] sm:text-xs font-semibold text-indigo-600 uppercase tracking-wider block">Total Taken</span>
            <span className="text-base sm:text-lg font-bold text-indigo-700 mt-0.5 block font-mono">₹{grandTotals.taken.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-3 sm:p-4 rounded-xl shadow-xs text-white col-span-2 md:col-span-1">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block">Net Target Gap</span>
            <span className="text-base sm:text-lg font-bold mt-0.5 block font-mono">
              {loading ? "..." : `₹${Math.max(0, grandTotals.expected - grandTotals.collected).toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>

        {/* Loading States & Fallbacks */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 animate-pulse text-sm">
            Loading data timelines...
          </div>
        )}

        {!loading && Object.keys(data).length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
            No collections recorded for this timeline.
          </div>
        )}

        {/* Layout Wrapper when Data Exists */}
        {!loading && Object.keys(data).length > 0 && (
          <>
            {/* 1. MOBILE CARDS LIST (Hidden on tablets/desktop) */}
            <div className="block md:hidden space-y-3">
              {Object.entries(data).map(([dueDate, row], index) => {
                const totalCollected = (row.cash || 0) + (row.upi || 0);
                const isEditing = editingRowId === dueDate;

                return (
                  <div key={dueDate}
                 className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">{getDayLabel(dueDate, index)}</span>
                      <span className="text-sm font-medium text-gray-700 hover:text-blue-700 cursor-pointer"   onClick={()=>{}}>{formatDate(dueDate)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex justify-between border-b border-dotted border-gray-100 pb-1">
                        <span className="text-gray-400">Cash:</span>
                        <span className="font-mono font-medium">₹{(row.cash || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-b border-dotted border-gray-100 pb-1">
                        <span className="text-gray-400">UPI:</span>
                        <span className="font-mono font-medium">₹{(row.upi || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-b border-dotted border-gray-100 pb-1">
                        <span className="text-gray-400">Expected:</span>
                        <span className="font-mono font-medium text-gray-600">₹{(row.expected || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-b border-dotted border-gray-100 pb-1">
                        <span className="text-green-600 font-semibold">Collected:</span>
                        <span className="font-mono font-bold text-green-700">₹{totalCollected.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Mobile Dynamic Editing Field */}
                    <div className="bg-indigo-50/30 rounded-lg p-2.5 border border-indigo-100/50 mt-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-2 text-gray-400 text-xs font-semibold">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={tempInputValue}
                              onChange={(e) => setTempInputValue(e.target.value)}
                              className="w-full pl-6 pr-2 py-1.5 text-sm bg-white border border-gray-300 rounded-md text-right font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            />
                          </div>
                          <button onClick={() => saveRowAmount(dueDate)} className="px-3 py-1.5 text-xs bg-indigo-600 text-white font-medium rounded-md shadow-xs hover:bg-indigo-700">Save</button>
                          <button onClick={cancelEditing} className="px-2.5 py-1.5 text-xs bg-gray-200 text-gray-600 font-medium rounded-md hover:bg-gray-300">✕</button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-semibold text-indigo-900">Taken Amount:</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold font-mono text-indigo-950 text-sm">₹{(row.taken || 0).toLocaleString("en-IN")}</span>
                            <button onClick={() => startEditing(dueDate, row.taken || 0)} className="text-xs font-bold text-indigo-600 bg-white border border-indigo-200 px-2.5 py-1 rounded-md shadow-xs hover:bg-indigo-50">Edit</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP LEDGER TABLE (Hidden on small screens) */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-300 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <th className="px-6 py-4">Day</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4 text-right">Cash</th>
                      <th className="px-6 py-4 text-right">UPI</th>
                      <th className="px-6 py-4 text-right">Total Collected</th>
                      <th className="px-6 py-4 text-right">Total Expected</th>
                      <th className="px-6 py-4 text-center w-64 bg-indigo-50/40 text-indigo-900 border-x border-gray-200">Taken Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {Object.entries(data).map(([dueDate, row], index) => {
                      const totalCollected = (row.cash || 0) + (row.upi || 0);
                      const isEditing = editingRowId === dueDate;

                      return (
                        <tr key={dueDate}
                       className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-500">
                            {getDayLabel(dueDate, index)}
                          </td>
                          <td className="px-6 py-4 hover:text-blue-600 cursor-pointer"   onClick={()=>{router.push(`${salesmanIdParam}/${dueDate}`)}}>
                            {formatDate(dueDate)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono">₹{(row.cash || 0).toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4 text-right font-mono">₹{(row.upi || 0).toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4 text-right text-green-700 font-semibold font-mono">₹{totalCollected.toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4 text-right font-semibold font-mono text-gray-600">₹{(row.expected || 0).toLocaleString("en-IN")}</td>
                          
                          {/* Interactive Taken Amount Column */}
                          <td className="px-4 py-3 bg-indigo-50/20 border-x">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-2 top-1.5 text-gray-400 text-xs font-semibold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={tempInputValue}
                                    onChange={(e) => setTempInputValue(e.target.value)}
                                    className="w-full pl-6 pr-2 py-1 text-sm border bg-white rounded text-right font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    autoFocus
                                  />
                                </div>
                                <button onClick={() => saveRowAmount(dueDate)} className="px-3 py-1 text-xs bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition">Save</button>
                                <button onClick={cancelEditing} className="px-2 py-1 text-xs bg-gray-200 text-gray-600 font-medium rounded hover:bg-gray-300 transition">✕</button>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center px-2">
                                <span className="font-semibold font-mono text-indigo-950">₹{(row.taken || 0).toLocaleString("en-IN")}</span>
                                <button onClick={() => startEditing(dueDate, row.taken || 0)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition">Edit</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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