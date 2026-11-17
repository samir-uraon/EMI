"use client";

import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { CalendarCheck, AlertCircle, Wallet, Smartphone, ArrowRight } from "lucide-react";

export default function AdminCollectionDashboard() {
  const router = useRouter();
  const { emiDate } = useParams();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  // Authorization state
  const isAdmin = session?.user?.email === "admin@Goldy";

  const displayDate =
    emiDate == 1 ? "1st" :
    emiDate == 11 ? "11th" :
    emiDate == 21 ? "21st" :
    emiDate;

  // Functional UI state management
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [salesmenData, setSalesmenData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState("");

  // Financial Metrics State
  const [metrics, setMetrics] = useState({
    totalEx: 0,        // Total Expected (Current Month)
    previousDue: 0,    // Previous Month Due
    totalCol: 0,       // Total Collected (Current Month)
    cash: 0,
    upi: 0,
  });

  // Handle access authentication securely
  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.replace("/login");
    }
  }, [status, isAdmin, router]);

  // Handle data ingestion
  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchData();
    }
  }, [status, isAdmin, emiDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/collection/${emiDate}`);
      const result = await res.json();

      if (result.success) {
        const loans = result.loans || [];
        const salesmen = result.salesmen || [];
        setCurrentMonth(result.currentMonth || "");

        setData(loans);

        // Date Boundary Setup for Current Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        let localTotalEx = 0;
        let localPreviousDue = 0;
        let localTotalCol = 0;
        let localCash = 0;
        let localUpi = 0;

        // Create salesman lookup map
        const salesmanLookup = {};
        salesmen.forEach((s) => {
          if (s._id) {
            salesmanLookup[s._id.toString()] = s;
          }
        });

        const salesmenMap = {};

        loans.forEach((loan) => {
          const salesmanId = loan.salesmanID?.toString() || "unassigned";
          const salesmanInfo = salesmanLookup[salesmanId];

          if (!salesmenMap[salesmanId]) {
            salesmenMap[salesmanId] = {
              id: salesmanId,
              name:
                salesmanInfo?.name ||
                salesmanInfo?.fullName ||
                loan.salesmanName ||
                "Unassigned",
              totalEx: 0,
              previousDue: 0,
              totalCol: 0,
              cash: 0,
              upi: 0,
            };
          }

          (loan.payments || []).forEach((payment) => {
            if (payment.removeMark) return;

            const baseAmount = Number(payment.amount || 0);
            const dueDateObj = payment.dueDate ? new Date(payment.dueDate) : null;
            const paidDateObj = payment.paidDate ? new Date(payment.paidDate) : null;

            // 1. Expected for Current Month
            if (dueDateObj && dueDateObj >= startOfMonth && dueDateObj <= endOfMonth) {
              localTotalEx += baseAmount;
              salesmenMap[salesmanId].totalEx += baseAmount;
            }

            // 2. Previous Month Due
            if (dueDateObj && dueDateObj < startOfMonth) {
              const isUnpaid = payment.status !== "Paid";
              const paidLateInCurrentMonth = paidDateObj && paidDateObj >= startOfMonth;

              if (isUnpaid || paidLateInCurrentMonth) {
                localPreviousDue += baseAmount;
                salesmenMap[salesmanId].previousDue += baseAmount;
              }
            }

            // 3. Collected in Current Month
            if (payment.status === "Paid" && paidDateObj && paidDateObj >= startOfMonth && paidDateObj <= endOfMonth) {
              let paidAmount = baseAmount;
              if (payment.finePaid) {
                paidAmount += Number(payment.fine || 0);
              }

              localTotalCol += paidAmount;
              salesmenMap[salesmanId].totalCol += paidAmount;

              if (payment.paymentMode?.toLowerCase() === "cash") {
                localCash += paidAmount;
                salesmenMap[salesmanId].cash += paidAmount;
              } else if (payment.paymentMode?.toLowerCase() === "upi") {
                localUpi += paidAmount;
                salesmenMap[salesmanId].upi += paidAmount;
              }
            }
          });
        });

        const salesmenArray = Object.values(salesmenMap);

        setMetrics({
          totalEx: localTotalEx,
          previousDue: localPreviousDue,
          totalCol: localTotalCol,
          cash: localCash,
          upi: localUpi,
        });

        setSalesmenData(salesmenArray);
      }
    } catch (error) {
      console.error("Dashboard fetching operation encountered an issue:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          <p className="text-gray-700 font-medium">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="p-4 sm:p-6 max-w-full space-y-6 bg-slate-100 min-h-screen">
      
      {/* Back Button */}
      <div>
        <button
          onClick={() => router.push("/admin/collection")}
          className="flex items-center shadow-xs gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition text-sm font-medium"
        >
          ← Back
        </button>
      </div>
      
      {/* Header section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            EMI Date Target: <span className="font-bold text-blue-600">{displayDate}</span>
          </h1>
          {currentMonth && (
            <p className="text-sm font-medium text-gray-500 mt-1">
              Active Month: <span className="text-gray-800 font-semibold">{currentMonth}</span>
            </p>
          )}
        </div>
      </header>

      {/* --- Overall Metrics Grid --- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
        
        {/* Total Expected Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Expected</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 font-mono">₹{metrics.totalEx.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full hidden sm:block">
            <CalendarCheck size={20} />
          </div>
        </div>

        {/* Previous Month Due Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-red-500 uppercase tracking-wider">Previous Due</p>
            <p className="text-lg sm:text-2xl font-bold text-red-600 mt-1 font-mono">₹{metrics.previousDue.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-2.5 bg-red-100 text-red-600 rounded-full hidden sm:block">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Total Collected Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Collected</p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600 mt-1 font-mono">₹{metrics.totalCol.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Cash Collected Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wider">Cash</p>
            <p className="text-lg sm:text-2xl font-bold text-amber-600 mt-1 font-mono">₹{metrics.cash.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-full hidden sm:block">
            <Wallet size={20} />
          </div>
        </div>

        {/* UPI Collected Card */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-indigo-600 uppercase tracking-wider">UPI</p>
            <p className="text-lg sm:text-2xl font-bold text-indigo-600 mt-1 font-mono">₹{metrics.upi.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-full hidden sm:block">
            <Smartphone size={20} />
          </div>
        </div>

      </div>

      {/* --- Salesmen Breakdown Section --- */}
      <section>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Salesmen Performance Breakdown</h2>
        
        {salesmenData.length === 0 ? (
          <div className="bg-white p-6 text-center rounded-xl border border-gray-200 text-gray-400 text-sm">
            No sales metrics available for this target date.
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARDS LIST */}
            <div className="block md:hidden space-y-3">
              {salesmenData.map((salesman) => (
                <div
                  key={salesman.id}
                  className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 space-y-3 active:bg-gray-50"
                >
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-950 text-base capitalize">{salesman.name}</h3>
                    <button 
                      onClick={() => router.push(`/admin/collection/${emiDate}/${salesman.id}`)}
                      className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded flex items-center gap-1"
                    >
                      View Ledger <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex justify-between border-b border-dotted border-gray-100 pb-1">
                      <span className="text-gray-500">Expected:</span>
                      <span className="font-mono font-semibold text-gray-800">₹{salesman.totalEx.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b border-dotted border-gray-100 pb-1">
                      <span className="text-red-500">Prev. Due:</span>
                      <span className="font-mono font-semibold text-red-600">₹{salesman.previousDue.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b border-dotted border-gray-100 pb-1 col-span-2">
                      <span className="text-emerald-700 font-medium">Collected:</span>
                      <span className="font-mono font-bold text-emerald-600">₹{salesman.totalCol.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-amber-600 font-medium">Cash:</span>
                      <span className="font-mono text-gray-700">₹{salesman.cash.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-indigo-600 font-medium">UPI:</span>
                      <span className="font-mono text-gray-700">₹{salesman.upi.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. DESKTOP GRID LAYOUT */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {salesmenData.map((salesman) => (
                <div 
                  key={salesman.id} 
                  onClick={() => router.push(`/admin/collection/${emiDate}/${salesman.id}`)}
                  className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Header card banner */}
                  <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center group-hover:bg-blue-50/40 transition">
                    <h3 className="font-bold text-gray-800 text-lg capitalize">{salesman.name}</h3>
                    <span className="text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      Details <ArrowRight size={12} />
                    </span>
                  </div>
                  
                  {/* Individual Salesman Stats Grid */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Expected</span>
                        <p className="text-base font-bold text-gray-800 font-mono mt-0.5">₹{salesman.totalEx.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">Previous Due</span>
                        <p className="text-base font-bold text-red-600 font-mono mt-0.5">₹{salesman.previousDue.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3">
                      <div>
                        <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Collected</span>
                        <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">₹{salesman.totalCol.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Cash</span>
                        <p className="text-sm font-semibold text-gray-800 font-mono mt-0.5">₹{salesman.cash.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">UPI</span>
                        <p className="text-sm font-semibold text-gray-800 font-mono mt-0.5">₹{salesman.upi.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

    </div>
  );
}