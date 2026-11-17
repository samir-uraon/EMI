"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import ScrollUp from "@/components/ScrollUp";

export default function OverdueCustomers() {
  const [loans, setLoans] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

const router = useRouter();
const { data: session,status } = useSession({
  required: true,
  onUnauthenticated() {
    router.replace("/login");
  },
});


  const isAdmin = session?.user?.email==="admin@Goldy";

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await fetch(isAdmin ? "/api/admin/me" : "/api/me");
        const data = await res.json();
        setLoans(data.loans || []);
 

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [status]);

const overdueCustomers = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return loans
    .map((loan) => {
      const nextPending = loan.payments?.find(
        (p) => p.status === "Pending"
      );

      return { ...loan, nextPending };
    })
    .filter((loan) => {
      if (loan.status !== "Active") return false;
      if (!loan.nextPending) return false;

      const dueDate = new Date(loan.nextPending.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const value = search.toLowerCase();

      return (
        dueDate <= today &&
        (
          loan.customerName?.toLowerCase().includes(value) ||
          loan.mobile?.includes(search)
        )
      );
    });
}, [loans, search]);


const totalOverdue = useMemo(() => {
  return overdueCustomers.reduce((sum, loan) => {
    const overduePayments =
      loan.payments?.filter((p) => {
        const dueDate = new Date(p.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        return p.status === "Pending" && dueDate <= new Date();
      }) || [];

    return sum + overduePayments.length * Number(loan.emiAmount);
  }, 0);
}, [overdueCustomers]);


 if (status === "loading"){
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
    <div className="min-h-screen bg-gray-100 p-6 ">
  {/* Back Button */}
  <button
    onClick={() => router.back()}
    className="mb-5 bg-white border shadow border-slate-300 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg shadow-sm transition w-full sm:w-fit"
  >
    ← Back
  </button>

  
      <div className="max-w-7xl mx-auto text-black ">

        <h1 className="text-3xl font-bold mb-6">
          📜 Overdue Customers
        </h1>

        <input
          type="text"
          placeholder="Search by customer name or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

<div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div className="text-center sm:text-left">
      <p className="text-sm text-gray-600">Total Overdue Customers</p>
      <h2 className="text-xl sm:text-2xl font-bold text-blue-600">
        {overdueCustomers.length}
      </h2>
    </div>

    <div className="border-t sm:border-t-0 sm:border-l border-blue-200 pt-4 sm:pt-0 sm:pl-6 text-center sm:text-right">
      <p className="text-sm text-gray-600">Total Overdue Amount</p>
      <h2 className="text-xl sm:text-2xl font-bold text-red-600 break-words">
        ₹{totalOverdue.toLocaleString("en-IN")}
      </h2>
    </div>
  </div>
</div>

  {/* Desktop Table */}
    <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200">
  <table className="min-w-[850px] w-full">

            <thead className="bg-gray-300">
              <tr>
                <th className="text-left px-5 py-4">Customer</th>
                <th className="text-left px-5 py-4">Mobile</th>
                {isAdmin?<th className="text-left px-5 py-4">SalesMen</th>:""}
                <th className="text-left px-5 py-4">EMI Date</th>
                <th className="text-left px-5 py-4">EMI</th>
                <th className="text-left px-5 py-4">Outstanding</th>
                <th className="text-left px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody>

              {overdueCustomers.length > 0 ? (
                overdueCustomers.map((loan) => (
         <tr
  key={loan._id}
  onClick={() => router.push(`/customer/${loan.customerId}`)}
  className="border-t hover:bg-slate-200 cursor-pointer transition"
>
                    <td className="px-5 py-4 font-semibold">
                      {loan.customerName}
                    </td>

                    <td className="px-5 py-4">
                      {loan.mobile}
                    </td>
{isAdmin &&
  <td className="px-5 py-4">
                      {loan.salesmanName}
                    </td>}
                  <td className="px-5 py-4">
  {new Date(loan.nextPending.dueDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}
</td>

                    <td className="px-5 py-4">
                      ₹{Number(loan.emiAmount).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4 text-red-600 font-semibold">
                      ₹
                      {(
                        Number(loan.totalLoanAmount) -
                        Number(loan.totalPaid)
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                        Overdue
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-gray-500"
                  >
                    🎉 No overdue customers found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

  {/* Mobile Cards */}
<div className="md:hidden space-y-3">
    {overdueCustomers.length > 0 ? (
      overdueCustomers.map((loan) => (
        <div
          key={loan._id}
          onClick={() => router.push(`/customer/${loan.customerId}`)}
          className="border rounded-xl p-4 shadow-sm active:scale-[0.99] transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-base">
                {loan.customerName}
              </h3>

              <p className="text-sm text-gray-500">
                {loan.mobile}
              </p>
                <p className="text-sm text-gray-500">
                {loan.salesmanName}
              </p>
            </div>

            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
              Overdue
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>EMI Date</span>

              <span>
            
  {new Date(loan.nextPending.dueDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}

              </span>
            </div>

            <div className="flex justify-between">
              <span>EMI</span>

              <span className="font-semibold">
                ₹{Number(loan.emiAmount).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Outstanding</span>

              <span className="font-semibold text-red-600">
                ₹
                {(
                  Number(loan.totalLoanAmount) -
                  Number(loan.totalPaid)
                ).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-8 text-gray-500">
        🎉 No Overdue Customers
      </div>
    )}
  </div>
</div>
<ScrollUp/>
</div>
     
  );
}