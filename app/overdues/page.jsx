"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export default function OverdueCustomers() {
  const [loans, setLoans] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, []);

  const today = new Date();

const overdueCustomers = useMemo(() => {
  return loans
    .filter((loan) => {
      if (loan.status !== "Active") return false;

      const nextPending = loan.payments?.find(
        (payment) => payment.status === "Pending"
      );

      if (!nextPending) return false;

      return new Date(nextPending.dueDate) <= today;
    })
    .filter((loan) => {
      const value = search.toLowerCase();

      return (
        loan.customerName?.toLowerCase().includes(value) ||
        loan.mobile?.includes(search)
      );
    });
}, [loans, search]);

 if (status === "loading" || loading){
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
            
  {new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    loan.emiDate
  ).toLocaleDateString("en-GB", {
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
                {new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  loan.emiDate
                ).toLocaleDateString("en-GB", {
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
</div>
     
  );
}