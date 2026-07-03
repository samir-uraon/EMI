"use client"

import React from 'react'
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";



export default function Dashboard() {
  

  const router = useRouter();
const [dashboard, setDashboard] = useState({
  totalCustomers: 0,
  totalSalesman: 0,
  totalLoans: 0,
  totalLoanAmount: 0,
  totalOutstanding: 0,
  monthlyEMI: 0,
  overdueEMI: 0,
  activeLoans: 0,
  monthlyCollection: 0,
  remain: 0,
  totalFine: 0,
});
const [loading, setLoading] = useState(true);



const { status } = useSession({
  required: true,
  onUnauthenticated() {
    router.replace("/login");
  },
});

const recoveredAmount =
  dashboard.totalLoanAmount - dashboard.totalOutstanding;

const progress =
  dashboard.totalLoanAmount > 0
    ? (recoveredAmount / dashboard.totalLoanAmount) * 100
    : 0;

useEffect(() => {
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin");

      if (!res.ok) {
        throw new Error("Failed to fetch dashboard");
      }

      const data = await res.json();

      if (data.success) {
        setDashboard(data);
      }
    } catch (error) {
      console.error(error);
      //await signOut({ callbackUrl: "/login" });
    } finally {
      setLoading(false);
    }
  };

  fetchDashboard();
}, []);



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
  <div className="min-h-screen bg-slate-100 p-6">

    {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
  <div>
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">
      Admin Dashboard
    </h1>

    <p className="mt-2 text-sm sm:text-base text-slate-500">
      Welcome back 👋 Manage your loan system efficiently.
    </p>
  </div>

  <button
    onClick={() => signOut({ callbackUrl: "/login" })}
    className="w-auto md:w-auto rounded-lg bg-blue-600 py-2 px-4 font-medium text-white transition hover:bg-blue-700"
  >
    Logout
  </button>
</div>

    {/* Dashboard Cards */}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-sm opacity-90">Monthly Collection</p>
        <h2 className="text-3xl font-bold mt-3">
          ₹{dashboard.monthlyCollection?.toLocaleString("en-IN")}
        </h2>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-sm opacity-90">Remaining Amount</p>
        <h2 className="text-3xl font-bold mt-3">
          ₹{dashboard.remain?.toLocaleString("en-IN")}
        </h2>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-sm opacity-90">Monthly EMI</p>
        <h2 className="text-3xl font-bold mt-3">
          ₹{dashboard.monthlyEMI?.toLocaleString("en-IN")}
        </h2>
      </div>

      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-6 shadow-lg">
        <p className="text-sm opacity-90">Overdue EMI</p>
        <h2 className="text-3xl font-bold mt-3">
          ₹{dashboard.overdueEMI?.toLocaleString("en-IN")}
        </h2>
      </div>

    </div>

    {/* Statistics */}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="text-gray-500 text-sm">Total Loan</h3>
        <p className="text-xl font-bold text-slate-800 mt-2">
          {dashboard.totalCustomers}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="text-gray-500 text-sm">Salesmen</h3>
        <p className="text-xl font-bold text-slate-800 mt-2">
          {dashboard.totalSalesman}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="text-gray-500 text-sm">Active Loans</h3>
        <p className="text-xl font-bold text-slate-800 mt-2">
          {dashboard.activeLoans}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="text-gray-500 text-sm">Total Fine</h3>
        <p className="text-xl font-bold text-slate-800 mt-2">
          ₹{dashboard.totalFine?.toLocaleString("en-IN")}
        </p>
      </div>

    </div>

    <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-2xl font-bold text-slate-800">
      📊 Loan Recovery Progress
    </h2>

    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
      {progress.toFixed(1)}%
    </span>
  </div>

  {/* Progress Bar */}
  <div className="h-5 w-full overflow-hidden rounded-full bg-slate-200">
    <div
      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700"
      style={{ width: `${progress}%` }}
    />
  </div>

  <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">

    <div>
      <p className="text-sm text-slate-500">Recovered</p>
      <p className="mt-1 text-xl font-bold text-green-600">
        ₹{recoveredAmount.toLocaleString("en-IN")}
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">Outstanding</p>
      <p className="mt-1 text-xl font-bold text-red-600">
        ₹{dashboard.totalOutstanding?.toLocaleString("en-IN")}
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">Total Loan</p>
      <p className="mt-1 text-xl font-bold text-blue-600">
        ₹{dashboard.totalLoanAmount.toLocaleString("en-IN")}
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">Recovery</p>
      <p className="mt-1 text-xl font-bold text-emerald-600">
        {progress.toFixed(1)}%
      </p>
    </div>

  </div>
</div>

    {/* Quick Actions */}

    <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
  <h2 className="mb-6 text-2xl font-bold text-slate-800">
    Quick Actions
  </h2>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

    {/* Customers */}
    <button
      onClick={() => router.push("/TotalCustomer")}
      className="flex flex-col items-center justify-center rounded-xl bg-blue-600 py-2  text-white shadow transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
    >
      <span className="mb-2 text-4xl">👥</span>
      <span className="font-semibold">Customers</span>
    </button>

    {/* Salesmen */}
    <button
      onClick={() => router.push("/admin/salesmen")}
      className="flex flex-col items-center justify-center rounded-xl bg-violet-600 py-2  text-white shadow transition-all duration-300 hover:-translate-y-1 hover:bg-violet-700 hover:shadow-xl"
    >
      <span className="mb-2 text-4xl">👨‍💼</span>
      <span className="font-semibold">Salesmen</span>
    </button>

    {/* Overdue EMI */}
    <button
      onClick={() => router.push("/overdues")}
      className="flex flex-col items-center justify-center rounded-xl bg-orange-500 py-2  text-white shadow transition-all duration-300 hover:-translate-y-1 hover:bg-orange-600 hover:shadow-xl"
    >
      <span className="mb-2 text-4xl">📅</span>
      <span className="font-semibold">Overdue EMI</span>
    </button>

      {/* Customers */}
    <button
      onClick={() => router.push("/EMI-Calculator")}
      className="flex flex-col items-center justify-center rounded-xl bg-blue-600 py-2  text-white shadow transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
    >
      <span className="mb-2 text-4xl">🧮</span>
      <span className="font-semibold">EMI Calculater</span>
    </button>

      <button
  onClick={() => router.push("/admin/collection")}
  className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:from-blue-700 hover:to-blue-800 active:scale-95"
>
<span className="text-4xl">💰</span>

  <span className="text-lg font-semibold">
    Collection
  </span>

  <span className="text-xs text-blue-100">
    Cash & UPI Summary
  </span>
</button>

  </div>
</div>

  </div>
);
}