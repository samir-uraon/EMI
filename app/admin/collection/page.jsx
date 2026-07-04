"use client"

import React, { useEffect, useState } from 'react';
import { Wallet, Smartphone, Search, Eye, CreditCard, Calendar } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState(null);

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

  // Combined Multi-Layer Filtering Logic
  const filteredTransactions = transactions.filter((item) => {
  const matchesSearch =
    item.customerName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    String(item.customerId || "").includes(searchTerm) ||
    item.mobile?.includes(searchTerm);

  const matchesMode =
    filterMode === "All" ||
    item.paymentMode === filterMode;

  const matchesDate =
    selectedDate === null ||
    item.emiDate == selectedDate;

  return matchesSearch && matchesMode && matchesDate;
});

  const handleDateClick = (day) => {
    if (selectedDate === day) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
    }
  };

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
    onClick={() => router.push(isAdmin?"/admin/dashboard":"/")}
        className="mb-6 flex items-center shadow-xs gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
      >
        ← Back
      </button> 

      {/* Header Panel */}
      <header className="mb-8 border-b pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-wide">Collection Dashboard</h1>
        {selectedDate && (
          <button 
            onClick={() => setSelectedDate(null)}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear Date Filter ({selectedDate}) ×
          </button>
        )}
      </header>

      {/* Analytical Highlight Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
      </div>

      {/* Date Assignment Action Panel */}
      {/* Collection Dates Section */}
<div className="mb-8">
  <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
    <Calendar size={16} />
    Filter by Collection Date
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {dates.map((date) => {
      const isSelected = selectedDate === date.day;

      return (
        <button
          key={date.day}
          onClick={() => handleDateClick(date.day)}
          className={`rounded-xl border p-5 text-left transition-all duration-200 ${
            isSelected
              ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]"
              : "bg-white border-gray-200 hover:border-blue-500 hover:shadow-md"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              {date.day}
              {date.day === "1"
                ? "st"
                : date.day === "11"
                ? "th"
                : "st"}
            </h3>

            <span
              className={`text-xs px-3 py-1 rounded-full ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {date.loanCount} Loans
            </span>
          </div>

          {/* Cash */}
          <div className="mt-5 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">💵 Cash</p>
              <p className="text-xs opacity-80">
                {date.cashCount} Payments
              </p>
            </div>

            <p className="font-bold">
              ₹{date.cashAmount.toLocaleString("en-IN")}
            </p>
          </div>

          {/* UPI */}
          <div className="mt-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">📱 UPI</p>
              <p className="text-xs opacity-80">
                {date.upiCount} Payments
              </p>
            </div>

            <p className="font-bold">
              ₹{date.upiAmount.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Total */}
          <div
            className={`mt-4 pt-3 border-t ${
              isSelected ? "border-white/30" : "border-gray-200"
            } flex justify-between items-center`}
          >
            <div>
              <p className="font-semibold">Total</p>
              <p className="text-xs opacity-80">
                {date.totalPayments} Payments
              </p>
            </div>

            <p className="text-lg font-bold">
              ₹{date.totalAmount.toLocaleString("en-IN")}
            </p>
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

      {/* Dynamic Tabular Ledger Display Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-6">Customer Id</th>
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Mobile</th>
                <th className="py-3 px-6">EMI</th>
                <th className="py-3 px-6">Paid Date</th>
                <th className="py-3 px-6">Mode</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6 text-center">SalesMen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((row,i) => (
                  <tr key={i} className="hover:bg-slate-100 transition-colors cursor-pointer"
																		onClick={()=>{router.push(`/customer/${row.customerId}`)}}>
                    <td className="py-4 px-6 font-medium text-blue-600">{row.customerId}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900">{row.customerName}</td>
                    <td className="py-4 px-6 text-gray-500">{row.mobile}</td>
                    <td className="py-4 px-6 font-medium text-gray-900">₹{row.amount?.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 text-gray-600 font-medium">{row.paidDate}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.paymentMode === 'Cash' ? 'bg-amber-100 text-amber-800' :
                        row.paymentMode === 'UPI' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-400'
                      }`}>
                        {row.paymentMode}
                      </span>
                    </td>
           <td className="py-4 px-6 text-gray-600 font-medium">{row.dueDate}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900">{row.salesmanName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400 font-medium">
                    No records found matching your selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CollectionDashboard;