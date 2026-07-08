"use client";

import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [salesmenData, setSalesmenData] = useState([]); 

  // Financial Metrics State
  const [metrics, setMetrics] = useState({
    totalEx: 0,   // Total Expected
    totalCol: 0,  // Total Collected
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

        setData(loans);

        let localTotalEx = 0;
        let localTotalCol = 0;
        let localCash = 0;
        let localUpi = 0;

        // Create lookup by _id
        const salesmanLookup = {};
        salesmen.forEach((s) => {
          if (s._id) {
            salesmanLookup[s._id.toString()] = s;
          }
        });

        const salesmenMap = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
              totalCol: 0,
              cash: 0,
              upi: 0,
            };
          }

          (loan.payments || []).forEach((payment) => {
            const due = new Date(payment.dueDate);
            due.setHours(0, 0, 0, 0);

            // Expected Calculation
            if (due <= today) {
              localTotalEx += Number(payment.amount || 0);
              salesmenMap[salesmanId].totalEx += Number(payment.amount || 0);
            }

            // Collected Calculation
            if (payment.status !== "Pending") {
              const amount = Number(payment.amount || 0);

              localTotalCol += amount;
              salesmenMap[salesmanId].totalCol += amount;

              if (payment.paymentMode?.toLowerCase() === "cash") {
                localCash += amount;
                salesmenMap[salesmanId].cash += amount;
              }

              if (payment.paymentMode?.toLowerCase() === "upi") {
                localUpi += amount;
                salesmenMap[salesmanId].upi += amount;
              }
            }
          });
        });

        const salesmenArray = Object.values(salesmenMap);

        setMetrics({
          totalEx: localTotalEx,
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

  if (status === "loading" || loading) {
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
    <div className="p-4 sm:p-6 max-w-full  space-y-6">
      
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
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          EMI Date Target: <span className="font-semibold text-blue-600">{displayDate}</span>
        </h1>
      </header>

      {/* --- Overall Metrics Grid --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Total Expected</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 font-mono">₹{metrics.totalEx.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Total Collected</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1 font-mono">₹{metrics.totalCol.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Collected (Cash)</p>
          <p className="text-lg sm:text-2xl font-bold text-amber-600 mt-1 font-mono">₹{metrics.cash.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Collected (UPI)</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1 font-mono">₹{metrics.upi.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* --- Salesmen Breakdown Section --- */}
      <section>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Salesmen Performance Breakdown</h2>
        
        {salesmenData.length === 0 ? (
          <div className="bg-white p-6 text-center rounded-xl border border-gray-200 text-gray-400 text-sm">
            No sales metrics available for this date filter.
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARDS LIST (Visible on small screens, hidden on desktop) */}
            <div className="block md:hidden space-y-3">
              {salesmenData.map((salesman) => (
                <div
                  key={salesman.id}
                
                  className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 space-y-3 active:bg-gray-50"
                >
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-950 text-base capitalize">{salesman.name}</h3>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded cursor-pointer"   onClick={() => router.push(`/admin/collection/${emiDate}/${salesman.id}`)}>View Ledger →</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex justify-between border-b border-dotted border-gray-100 pb-1">
                      <span className="text-gray-400">Expected:</span>
                      <span className="font-mono font-semibold text-gray-700">₹{salesman.totalEx.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b border-dotted border-gray-100 pb-1">
                      <span className="text-gray-400">Collected:</span>
                      <span className="font-mono font-bold text-green-600">₹{salesman.totalCol.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-amber-600 font-medium">Cash:</span>
                      <span className="font-mono text-gray-600">₹{salesman.cash.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-blue-600 font-medium">UPI:</span>
                      <span className="font-mono text-gray-600">₹{salesman.upi.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. DESKTOP GRID LAYOUT (Hidden on mobile) */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {salesmenData.map((salesman) => (
                <div 
                  key={salesman.id} 
                  
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-blue-600 transition-all cursor-pointer group"
                >
                  {/* Header card banner */}
                  <div className="bg-slate-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center group-hover:bg-blue-50/30">
                    <h3 className="font-bold text-gray-800 text-lg capitalize">{salesman.name}</h3>
                    <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => router.push(`/admin/collection/${emiDate}/${salesman.id}`)}>Details →</span>
                  </div>
                  
                  {/* Individual Salesman Stats Grid */}
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Expected</span>
                      <p className="text-lg font-bold text-gray-700 font-mono">₹{salesman.totalEx.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Collected</span>
                      <p className="text-lg font-bold text-green-600 font-mono">₹{salesman.totalCol.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">Cash</span>
                      <p className="text-md font-semibold text-gray-800 font-mono">₹{salesman.cash.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">UPI</span>
                      <p className="text-md font-semibold text-gray-800 font-mono">₹{salesman.upi.toLocaleString("en-IN")}</p>
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