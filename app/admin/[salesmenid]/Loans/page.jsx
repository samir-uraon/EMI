"use client";

import ScrollUp from "@/components/ScrollUp";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoansPage() {
	const router = useRouter();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
			const { salesmenid } = useParams();

  useEffect(() => {
    fetchLoans();
  }, []);

  const { data: session, status } = useSession({
  required: true,
  onUnauthenticated() {
    router.replace("/login");
  },
});

const isAdmin = session?.user?.email==="admin@Goldy";

  const fetchLoans = async () => {
    try {
const res = await fetch(`/api/admin/${salesmenid}`);
      const data = await res.json();
      setLoans(data.loans || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 text-md	text-black min-h-screen bg-slate-100">
					 <button
    onClick={() => router.push(isAdmin?"/admin/salesmen":"/")}
      className="mb-4 flex items-center gap-2 shadow bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
    >
      ← Back
    </button>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Loans
        </h1>
        <p className="text-slate-500">
          View and manage all customer loans.
        </p>
      </div>

      {/* Table */}
      {/* Desktop Table */}
<div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
  <table className="w-full">
    <thead className="bg-gray-200">
      <tr>
        <th className="px-4 py-3 text-left">ID</th>
        <th className="px-4 py-3 text-left">Customer</th>
        <th className="px-4 py-3 text-left">Loan Amount</th>
        <th className="px-4 py-3 text-left">EMI</th>
        <th className="px-4 py-3 text-left">Paid</th>
        <th className="px-4 py-3 text-left">Status</th>
      </tr>
    </thead>

    <tbody>
      {loading ? (
        <tr>
          <td colSpan={6} className="text-center py-8">
            Loading...
          </td>
        </tr>
      ) : loans.length === 0 ? (
        <tr>
          <td colSpan={6} className="text-center py-8">
            No loans found.
          </td>
        </tr>
      ) : (
        loans.map((loan) => (
          <tr
            key={loan._id}
            onClick={() => router.push(`/customer/${loan.customerId}`)}
            className="border-t hover:bg-slate-100 cursor-pointer transition"
          >
            <td className="px-4 py-3">{loan.customerId}</td>
            <td className="px-4 py-3">{loan.customerName}</td>
            <td className="px-4 py-3">
              ₹{Number(loan.totalLoanAmount).toLocaleString("en-IN")}
            </td>
            <td className="px-4 py-3">
              ₹{Number(loan.emiAmount).toLocaleString("en-IN")}
            </td>
            <td className="px-4 py-3">
              {loan.paidEmi}/{loan.numberOfEmi}
            </td>
            <td className="px-4 py-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  loan.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {loan.status}
              </span>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

{/* Mobile Cards */}
<div className="md:hidden space-y-4">
  {loading ? (
    <div className="bg-white rounded-xl p-6 text-center shadow">
      Loading...
    </div>
  ) : loans.length === 0 ? (
    <div className="bg-white rounded-xl p-6 text-center shadow">
      No loans found.
    </div>
  ) : (
    loans.map((loan) => (
      <div
        key={loan._id}
        onClick={() => router.push(`/customer/${loan.customerId}`)}
        className="bg-white rounded-xl shadow p-4 border cursor-pointer active:scale-[0.98] transition"
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-lg text-slate-800">
              {loan.customerName}
            </h2>

            <p className="text-sm text-slate-500">
              ID: {loan.customerId}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              loan.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {loan.status}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm">

          <div className="flex justify-between">
            <span className="text-gray-500">Loan Amount</span>
            <span className="font-semibold">
              ₹{Number(loan.totalLoanAmount).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">EMI</span>
            <span className="font-semibold">
              ₹{Number(loan.emiAmount).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Paid EMI</span>
            <span className="font-semibold">
              {loan.paidEmi}/{loan.numberOfEmi}
            </span>
          </div>

        </div>
      </div>
    ))
  )}
</div>
<ScrollUp/>
    </div>
  );
}