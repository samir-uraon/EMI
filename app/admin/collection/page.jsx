"use client"

import React, { useEffect, useState } from 'react';
import { Wallet, Smartphone, Search, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const CollectionDashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  // Authorization state
  const isAdmin = session?.user?.email === "admin@Goldy";

  // Functional UI state management
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('All');

  // Financial and collection dataset states
  const [stats, setStats] = useState({
    cash: { amount: 0, count: 0 },
    upi: { amount: 0, count: 0 },
  });
  const [transactions, setTransactions] = useState([]);
  const [dates, setDates] = useState([]);

  // Handle access authentication securely
  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.replace("/login");
    }
  }, [status, session, isAdmin, router]);

  // Handle data ingestion
  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchData();
    }
  }, [status, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/collection");
      const data = await res.json();
    
      if (data.success) {
        setStats(data.stats || { cash: { amount: 0, count: 0 }, upi: { amount: 0, count: 0 } });
        setTransactions(data.transactions || []);
        setDates(data.dates || []);
      }
    } catch (error) {
      console.error("Dashboard fetching operation encountered an issue:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigates directly to your dynamic route folder structure (e.g., app/admin/collection/[date]/page.jsx)
  const handleDateClick = (day) => {
    router.push(`/admin/collection/${day}`);
  };

  // Combined Multi-Layer Filtering Logic
  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch =
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.customerId || "").includes(searchTerm) ||
      item.mobile?.includes(searchTerm);

    const matchesMode =
      filterMode === "All" ||
      item.paymentMode === filterMode;

    return matchesSearch && matchesMode;
  });

  // Display standardized loading presentation if status evaluates true
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

  return (
    <div className="max-w-screen p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* Back Navigation Bar */}
      <button
        onClick={() => router.push(isAdmin ? "/admin/dashboard" : "/")}
        className="mb-6 flex items-center shadow-xs gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
      >
        ← Back
      </button> 

      {/* Header Panel */}
      <header className="mb-8 border-b pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-wide">Collection Dashboard</h1>
      </header>

      {/* Analytical Highlight Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Cash Metric Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Cash</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{stats.cash.amount.toLocaleString('en-IN')}</h3>
            <p className="text-sm text-green-600 mt-2 font-medium">{stats.cash.count} Payments</p>
          </div>
          <div className="p-4 bg-amber-100 text-amber-600 rounded-full">
            <Wallet size={28} />
          </div>
        </div>

        {/* UPI Metric Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total UPI</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{stats.upi.amount.toLocaleString('en-IN')}</h3>
            <p className="text-sm text-indigo-600 mt-2 font-medium">{stats.upi.count} Payments</p>
          </div>
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full">
            <Smartphone size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Taken</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{stats.totalTaken?.toLocaleString('en-IN')}</h3>
            <p className="text-sm text-green-600 mt-2 font-medium">{stats.totalTakenCount} Payments</p>
          </div>
          <div className="p-4 bg-amber-100 text-amber-600 rounded-full">
            <Wallet size={28} />
          </div>
        </div>

      </div>

      {/* Collection Dates Section */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Calendar size={16} />
          Click Target Date to Open Ledger Page
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {dates.map((date) => {
            return (
              <button
                key={date.day}
                onClick={() => handleDateClick(date.day)}
                className="rounded-xl border p-5 text-left transition-all duration-200 bg-white border-gray-200 hover:border-blue-500 hover:shadow-md hover:scale-[1.01]"
              >
                {/* Header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    {date.day}
                    {date.day === "1" ? "st" : date.day === "11" ? "th" : "th"}
                  </h3>

                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                    {date.loanCount} Loans
                  </span>
                </div>

                {/* Cash */}
                <div className="mt-5 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">💵 Cash</p>
                    <p className="text-xs text-gray-400">{date.cashCount} Payments</p>
                  </div>
                  <p className="font-bold text-gray-800">₹{date.cashAmount.toLocaleString("en-IN")}</p>
                </div>

                {/* UPI */}
                <div className="mt-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">📱 UPI</p>
                    <p className="text-xs text-gray-400">{date.upiCount} Payments</p>
                  </div>
                  <p className="font-bold text-gray-800">₹{date.upiAmount.toLocaleString("en-IN")}</p>
                </div>

                {/* Total */}
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Total</p>
                    <p className="text-xs text-gray-400">{date.totalPayments} Payments</p>
                  </div>
                  <p className="text-lg font-bold text-blue-600">₹{date.totalAmount.toLocaleString("en-IN")}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar / Mode Selection Filter Component */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Search by Name / Loan ID / Mobile"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6 px-2">
          {['All', 'Cash', 'UPI'].map((mode) => (
            <label key={mode} className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="filterMode"
                checked={filterMode === mode}
                onChange={() => setFilterMode(mode)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span>{mode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                <th className="py-3 px-6">Customer Id</th>
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Mobile</th>
                <th className="py-3 px-6">EMI</th>
                <th className="py-3 px-6">Paid Date</th>
                <th className="py-3 px-6">Mode</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6">Salesman</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => router.push(`/customer/${row.customerId}`)}
                    className="hover:bg-slate-100 cursor-pointer"
                  >
                    <td className="py-4 px-6 text-blue-600 font-semibold">{row.customerId}</td>
                    <td className="py-4 px-6">{row.customerName}</td>
                    <td className="py-4 px-6">{row.mobile}</td>
                    <td className="py-4 px-6">₹{row.amount?.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-6">{row.paidDate.split("T")[0]}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.paymentMode === "Cash" ? "bg-amber-100 text-amber-800" : row.paymentMode === "UPI" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {row.paymentMode}
                      </span>
                    </td>
                    <td className="py-4 px-6">{row.dueDate?.split("T")[0]}</td>
                    <td className="py-4 px-6">{row.salesmanName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((row, i) => (
            <div
              key={i}
              onClick={() => router.push(`/customer/${row.customerId}`)}
              className="bg-white rounded-xl shadow border p-4 active:scale-[0.98] transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{row.customerName}</h3>
                  <p className="text-xs text-blue-600">{row.customerId}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  row.paymentMode === "Cash" ? "bg-amber-100 text-amber-800" : row.paymentMode === "UPI" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-500"
                }`}>
                  {row.paymentMode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Mobile</p>
                  <p className="font-medium">{row.mobile}</p>
                </div>
                <div>
                  <p className="text-gray-500">EMI</p>
                  <p className="font-bold text-green-600">₹{row.amount?.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-gray-500">Paid Date</p>
                  <p>{row.paidDate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p>{row.dueDate?.split("T")[0]}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Salesman</p>
                  <p className="font-medium">{row.salesmanName}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow">
            No records found matching your selection.
          </div>
        )}
      </div>

    </div>
  );
};

export default CollectionDashboard;