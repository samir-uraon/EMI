"use client"

import React from 'react'
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";



export default function Dashboard() {
  
  const profileRef = useRef(null);
	const router = useRouter();
  const [user, setUser] = useState(null);
    const [loans, setLoans] = useState(null);
const [loading, setLoading] = useState(true);
const [showProfile, setShowProfile] = useState(false);


const {data: session, status } = useSession({
  required: true,
  onUnauthenticated() {
    router.replace("/login");
  },
});

const isAdmin = session?.user?.email==="admin@Goldy";

useEffect(() => {
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setShowProfile(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);




  const fetchUser = async () => {
    try {
      setLoading(true);

      const res = await fetch(isAdmin?"/api/admin/me":"/api/me");
      
            
      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }
      
      const data = await res.json();
      setUser(data.user);
      setLoans(data.loans)
    } catch (error) {
      await signOut({ callbackUrl: "/login" });
        return;

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (status === "authenticated") {
        if(isAdmin){
    router.push("/admin/dashboard")
    return
  }
      fetchUser();
    }
  }, [status]);





const activeLoans = loans?.filter((loan) => loan.status === "Active");

const totalOutstanding = activeLoans?.reduce(
  (sum, loan) =>
    sum + ((Number(loan.totalLoanAmount) || 0) - (Number(loan.totalPaid) || 0)),
  0
);

const today = new Date();

const totalMonthlyEmi = activeLoans?.reduce((sum, loan) => {
  const monthlyAmount =
    loan.payments?.reduce((paymentSum, payment) => {
      const dueDate = new Date(payment.dueDate);

      if (
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear()
      ) {
        return paymentSum + Number(payment.amount || 0);
      }

      return paymentSum;
    }, 0) || 0;

  return sum + monthlyAmount;
}, 0);

// Find nearest EMI date


const nextEmiLoan = activeLoans?.filter((loan) => new Date(loan.nextEmiDate) >= today).sort((a, b) => new Date(a.nextEmiDate) - new Date(b.nextEmiDate))[0];

const emiDays = [1, 11, 21];

 const currentDay = today.getDate();

let nextDate;

// Find the next EMI day after today
const nextDay = emiDays.find((day) => day > currentDay);

if (nextDay) {
  nextDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    nextDay
  );
} else {
  // If today is after the last EMI day, move to next month's first EMI
  nextDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    emiDays[0]
  );
}

const nextEmi = nextDate?.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

 

const activeLoanCount = activeLoans?.length;



const totalLoanAmount =
  activeLoans?.reduce(
    (sum, loan) => sum + Number(loan.totalLoanAmount || 0),
    0
  ) || 0;

const totalPaidAmount =
  activeLoans?.reduce(
    (sum, loan) => sum + Number(loan.totalPaid || 0),
    0
  ) || 0;


const totalOutstanding2 =
  activeLoans?.reduce(
    (sum, loan) =>
      sum +
      (Number(loan.totalLoanAmount || 0) -
        Number(loan.totalPaid || 0)),
    0
  ) || 0;

const progress =
  totalLoanAmount > 0
    ? (totalPaidAmount / totalLoanAmount) * 100
    : 0;




const upcomingLoans = activeLoans
  ?.map((loan) => {
    const nextPending = loan.payments?.find(
      (payment) => payment.status === "Pending"
    );

    if (!nextPending) return null;

    return {
      ...loan,
      upcomingDate: new Date(nextPending.dueDate),
      emiAmount: nextPending.amount,
    };
  })



  const displayedUpcomingCustomers = upcomingLoans?.sort((a,b) => a.upcomingDate - b.upcomingDate) // Shuffle
  .slice(0, 3);



const overdueCustomers = activeLoans?.filter((loan) => {
  const nextPending = loan.payments?.find(
    (payment) => payment.status === "Pending"
  );

  if (!nextPending) return false;

  return new Date(nextPending.dueDate) <= today;
});


const displayedOverdueCustomers = overdueCustomers?.slice(0, 3);

if (status === "loading" || loading || !user) {
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
    <div className="min-h-screen bg-gray-100 p-6 text-black">

    <div className=" rounded-lg  px-5 flex justify-between items-center relative">
  <h1 className="text-xl font-bold">Home</h1>

  <div className="flex items-center gap-5 text-xl">
  

    <div className="relative">
<button
  onClick={() => setShowProfile(!showProfile)}
  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 px-3 py-2 rounded-lg text-xl"
>
  <span>👤</span>
  <span className="font-semibold">{user?.name?.split(" ")[0]}</span>
</button>

    {showProfile && (
  <div
    ref={profileRef}
    className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border p-5 z-50"
  >
    {/* Close Button */}
    <button
      onClick={() => setShowProfile(false)}
      className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
    >
      ✕
    </button>

    <div className="flex flex-col items-center">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
        {user?.name?.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <h2 className="mt-3 text-lg font-bold">{user?.name}</h2>

      {/* Email */}
      <p className="text-gray-500 text-sm">{user?.email}</p>

      <hr className="w-full my-4" />

      {/* Login Profile */}
      <button
        className="w-full py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-all"
        onClick={() => router.push("/login")}
      >
        Login
      </button>

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full mt-2 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
      >
        Logout
      </button>
    </div>
  </div>
)}
    </div>
  </div>
</div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
		<div className="bg-white rounded-lg shadow p-5">
				<p className="text-gray-500">💰 Total Outstanding</p>
				<h2 className="text-2xl font-bold mt-2">
						₹{totalOutstanding.toLocaleString("en-IN")}
				</h2>
		</div>
		<div className="bg-white rounded-lg shadow p-5">
				<p className="text-gray-500">📅 Total Loans Amount</p>
				<h2 className="text-2xl font-bold mt-2">
						₹{totalLoanAmount.toLocaleString("en-IN")}
				</h2>
		</div>

		<div className="bg-white rounded-lg shadow p-5">
				<p className="text-gray-500">💵 Total Monthly EMI</p>
				<h2 className="text-2xl font-bold mt-2">
						₹{totalMonthlyEmi.toLocaleString("en-IN")}
				</h2>
		</div>

		

		<div className="bg-white rounded-lg shadow p-5">
				<p className="text-gray-500">📈 Active Loans</p>
				<h2 className="text-2xl font-bold mt-2">{activeLoanCount}</h2>
		</div>
</div>
    

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">⚡ Quick Actions</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

  <button
    onClick={() => router.push("/EMI-Calculator")}
    className="bg-green-600 text-white rounded-lg py-4 font-semibold flex flex-col md:flex-row items-center justify-center gap-2 hover:bg-green-700 transition"
  >
    <span className="text-2xl">🧮</span>
    <span>EMI Calculator</span>
  </button>

  <button
    onClick={() => router.push("/AddLoan")}
    className="bg-blue-600 text-white rounded-lg py-4 font-semibold flex flex-col md:flex-row items-center justify-center gap-2 hover:bg-blue-700 transition"
  >
    <span className="text-2xl">🏦</span>
    <span>Add Loan</span>
  </button>

  <button
    onClick={() => router.push("/TotalCustomer")}
    className="bg-orange-500 text-white rounded-lg py-4 font-semibold flex flex-col md:flex-row items-center justify-center gap-2 hover:bg-orange-600 transition"
  >
    <span className="text-2xl">📄</span>
    <span>Total Customer</span>
  </button>

  <button
    onClick={() => router.push("/overdues")}
    className="bg-purple-600 text-white rounded-lg py-4 font-semibold flex flex-col md:flex-row items-center justify-center gap-2 hover:bg-purple-700 transition"
  >
    <span className="text-2xl">📜</span>
    <span>Overdue Customers</span>
  </button>

</div>
      </div>

      {/* Bottom */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        {/* Upcoming EMI */}
      <div className="bg-white rounded-xl shadow p-4 md:p-6">

  <h2 className="text-lg md:text-xl font-bold mb-4">
    📅 Upcoming EMIs
  </h2>

  {/* Desktop Table */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b text-left text-gray-600">
          <th className="py-3 px-2">Customer</th>
          <th className="px-2">Date</th>
          <th className="px-2">EMI</th>
          <th className="px-2">Status</th>
        </tr>
      </thead>

      <tbody>
        {displayedUpcomingCustomers?.length > 0 ? (
          displayedUpcomingCustomers.map((loan, index) => (
            <tr
              key={index}
              onClick={() => router.push(`/customer/${loan.customerId}`)}
              className="border-b last:border-none cursor-pointer hover:bg-blue-50 transition"
            >
              <td className="py-3 px-2 font-medium">
                {loan.customerName}
              </td>

              <td className="px-2">
                {loan.upcomingDate.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>

              <td className="px-2 font-semibold">
                ₹{Number(loan.emiAmount).toLocaleString("en-IN")}
              </td>

              <td className="px-2">
                <span className="text-red-500 font-semibold">
                  Pending
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={4}
              className="py-8 text-center text-gray-500"
            >
              No Upcoming EMI
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>




  {/* Mobile Cards */}
  <div className="md:hidden space-y-3">
    {displayedUpcomingCustomers?.length > 0 ? (
      displayedUpcomingCustomers.map((loan) => (
        <div
          key={loan._id}
          onClick={() => router.push(`/customer/${loan.customerId}`)}
          className="border rounded-xl p-4 shadow-sm active:scale-[0.99] transition cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base">
              {loan.customerName}
            </h3>

            <span className="text-red-500 font-semibold text-sm">
              Pending
            </span>
          </div>

          <div className="mt-3 text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Date:</span>{" "}
              {loan.upcomingDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>

            <p>
              <span className="font-medium">EMI:</span>{" "}
              ₹{Number(loan.emiAmount).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-8 text-gray-500">
        No Upcoming EMI
      </div>
    )}
  </div>

  {upcomingLoans?.length > 3 && (
    <div className="flex justify-center mt-5">
      <button
        onClick={() => router.push("/TotalCustomer")}
        className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Show More ({upcomingLoans.length - 3}+)
      </button>
    </div>
  )}
</div>

        {/* Progress */}
        <div className="bg-white rounded-lg shadow p-5">
  <h2 className="text-xl font-bold mb-4">
    📊 EMI Progress
  </h2>

  <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-6 bg-green-500 rounded-full transition-all duration-500"
      style={{ width: `${progress}%` }}
    ></div>
  </div>

  <div className="flex justify-between mt-2">
    <span className="text-sm text-gray-500">
      {progress.toFixed(1)}% Paid
    </span>
    <span className="text-sm text-gray-500">
      {(100 - progress).toFixed(1)}% Remaining
    </span>
  </div>

  <div className="flex justify-between mt-5">
    <div>
      <p className="text-gray-500">Paid</p>
      <p className="text-xl font-bold text-green-600">
        ₹{totalPaidAmount.toLocaleString("en-IN")}
      </p>
    </div>

    <div>
      <p className="text-gray-500">Remaining</p>
      <p className="text-xl font-bold text-red-600">
        ₹{totalOutstanding2.toLocaleString("en-IN")}
      </p>
    </div>
  </div>
</div>

      </div>

      <div className="bg-white rounded-lg shadow p-5 mt-8">
  <h2 className="text-xl font-bold mb-4">
    📜 Overdue Customers
  </h2>

  {/* Mobile */}
  <div className="md:hidden space-y-3">
    {displayedOverdueCustomers?.length > 0 ? (
      displayedOverdueCustomers.map((loan) => (
        <div
          key={loan._id}
          onClick={() =>
            router.push(`/customer/${loan.customerId}/payments`)
          }
          className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-slate-800">
              {loan.customerName}
            </h3>

            <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-semibold">
              Overdue
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Date</span>
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
          </div>
        </div>
      ))
    ) : (
      <div className="py-6 text-center text-green-600 font-medium">
        🎉 No Overdue Customers
      </div>
    )}
  </div>

  {/* Desktop */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b text-left text-gray-600">
          <th className="py-2">Customer</th>
          <th>Date</th>
          <th>EMI</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {displayedOverdueCustomers?.length > 0 ? (
          displayedOverdueCustomers.map((loan) => (
            <tr
              key={loan._id}
              onClick={() =>
                router.push(`/customer/${loan.customerId}/payments`)
              }
              className="border-b last:border-none hover:bg-blue-50 cursor-pointer transition"
            >
              <td className="py-3 font-medium">
                {loan.customerName}
              </td>

              <td>
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

              <td>
                ₹{Number(loan.emiAmount).toLocaleString("en-IN")}
              </td>

              <td>
                <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-sm font-semibold">
                  Overdue
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={4}
              className="py-6 text-center text-green-600 font-medium"
            >
              🎉 No Overdue Customers
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {overdueCustomers.length > 3 && (
    <div className="flex justify-center mt-5">
      <button
        onClick={() => router.push("/TotalCustomer")}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Show More ({overdueCustomers.length - 3}+)
      </button>
    </div>
  )}
</div>
</div>
  );
}
