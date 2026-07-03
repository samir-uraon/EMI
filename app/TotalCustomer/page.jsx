"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState,useEffect } from "react";
import ScrollUp from "@/components/ScrollUp";
import { useSession } from "next-auth/react";

export default function CustomerDashboard() {

const [customers, setCustomers] = useState([]);
const [loading, setLoading] = useState(false);
const [onlyActive, setOnlyActive] = useState(true);
const [onlyActive2, setOnlyActive2] = useState(false);
const router = useRouter();
const { data: session, status } = useSession({
  required: true,
  onUnauthenticated() {
    router.replace("/login");
  },
});

const isAdmin = session?.user?.email==="admin@Goldy";


useEffect(() => {
  fetchCustomers();
}, [status]);

const fetchCustomers = async () => {
  try {
    setLoading(true);

    const res = await fetch(isAdmin ? "/api/admin/me" : "/api/me");
    const data = await res.json();

    if (data.success) {
      setCustomers(data.loans);
    }
  } catch (error) {
        router.push("/");
    console.error(error);
  } finally {
    setLoading(false);
  }
};



  const firstCount = customers.filter(
    (c) => Number(c.emiDate) === 1
  ).length;

  const elevenCount = customers.filter(
    (c) => Number(c.emiDate) === 11
  ).length;

  const twentyOneCount = customers.filter(
    (c) => Number(c.emiDate) === 21
  ).length;



  const [selectedDate, setSelectedDate] = useState(1);
  const totalCustomers = customers.length;
const [search, setSearch] = useState("");
const [searchAll, setSearchAll] = useState(false);
		
  const filteredCustomers = useMemo(() => {
  let data = searchAll
    ? customers
    : customers.filter(
        (customer) => Number(customer.emiDate) === selectedDate
      );

  // Show only active loans when checked
  if (onlyActive) {
    data = data.filter(
      (customer) => customer.status !== "Completed"
    );
  }
    if (onlyActive2) {
    data = data.filter(
      (customer) => Number(customer.fineCount) !== 0
    );
  }

  if (search.trim() !== "") {
    data = data.filter(
      (customer) =>
        customer.customerId.toString().includes(search) ||
        customer.customerName
          .toLowerCase()
          .includes(search.toLowerCase())
    );
  }

  return data;
}, [customers, selectedDate, search, searchAll, onlyActive, onlyActive2]);


const activeLoans = customers.filter(
  (c) => c.status !== "Completed"
).length;

const completedLoans = customers.filter(
  (c) => c.status === "Completed"
).length;


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
<>
<div className="min-h-screen bg-slate-100 p-7 sm:p-6">

  {/* Back Button */}
  <button
    onClick={() => router.back()}
    className="mb-5 bg-white border shadow border-slate-300 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg shadow-sm transition w-full sm:w-fit"
  >
    ← Back
  </button>

  {/* Dashboard Card */}

  <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6">

  {/* Total Customers */}
  <div className="flex items-center gap-2 sm:gap-3">
    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
      Total Customers
    </h2>
    <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold">
      {customers.length}
    </span>
  </div>

  {/* Active Loans */}
  <div className="flex items-center gap-2">
    <h2 className="text-sm sm:text-base font-semibold text-slate-700">
      Active Loans
    </h2>
    <span className="bg-green-600 text-white px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold">
      {activeLoans}
    </span>
  </div>

  {/* Completed Loans */}
  <div className="flex items-center gap-2">
    <h2 className="text-sm sm:text-base font-semibold text-slate-700">
      Completed Loans
    </h2>
    <span className="bg-yellow-500 text-white px-2.5 py-1 rounded-md text-xs sm:text-sm font-semibold">
      {completedLoans}
    </span>
  </div>

</div>

    {/* EMI Buttons */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        onClick={() => setSelectedDate(1)}
        className={`rounded-xl py-4 font-semibold shadow transition ${
          selectedDate === 1
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
        }`}
      >
        <p className="text-lg">1st</p>
        <p className="text-sm mt-1">({firstCount}) Customers</p>
      </button>

      <button
        onClick={() => setSelectedDate(11)}
        className={`rounded-xl py-4 font-semibold shadow transition ${
          selectedDate === 11
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
        }`}
      >
        <p className="text-lg">11th</p>
        <p className="text-sm mt-1">({elevenCount}) Customers</p>
      </button>

      <button
        onClick={() => setSelectedDate(21)}
        className={`rounded-xl py-4 font-semibold shadow transition ${
          selectedDate === 21
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
        }`}
      >
        <p className="text-lg">21st</p>
        <p className="text-sm mt-1">({twentyOneCount}) Customers</p>
      </button>

    </div>

  
<div className="mt-6 flex flex-col lg:flex-row gap-4">

  {/* Search */}
  <input
    type="text"
    placeholder="Search Customer By Name or ID"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full lg:flex-1 border border-slate-300 rounded-lg px-4 py-3 text-black focus:ring-2 focus:ring-blue-500 outline-none"
  />

  <div className="flex flex-wrap gap-6">

    {/* Search Overall */}
    <label className="flex items-center gap-2 text-slate-700 font-medium">
      <input
        type="checkbox"
        checked={searchAll}
        onChange={(e) => setSearchAll(e.target.checked)}
        className="w-5 h-5 accent-blue-600"
      />
      Search Overall
    </label>

    {/* Only Active Loan */}
    <label className="flex items-center gap-2 text-slate-700 font-medium">
      <input
        type="checkbox"
        checked={onlyActive}
        onChange={(e) => setOnlyActive(e.target.checked)}
        className="w-5 h-5 accent-blue-600"
      />
      Only Active Loan
    </label>

    {/* Only Customers with Fines */}
  {isAdmin
   && (
    <label className="flex items-center gap-2 text-slate-700 font-medium">
      <input
        type="checkbox"
        checked={onlyActive2}
        onChange={(e) => setOnlyActive2(e.target.checked)}
        className="w-5 h-5 accent-blue-600"
      />
      Fines
    </label>)}

  </div>

</div>

  {/* Customer List */}
  <div className="mt-8 grid gap-5">

    {filteredCustomers.length > 0 ? (
      filteredCustomers.map((customer) => (
        <div
  key={customer.customerId}
  className={`bg-white rounded-xl shadow-md hover:shadow-xl transition p-5 border-l-4 ${
    customer.status === "Completed"
      ? "border-yellow-500"
      : "border-blue-600"
  }`}
>
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-lg font-bold text-slate-800">
      #{customer.customerId}
    </h3>

  <div className="flex gap-2 flex-wrap">
  <span className="bg-blue-400 text-white px-3 py-1 rounded-md text-sm">
    EMI{" "}
    {customer.emiDate == 1
      ? "1st"
      : customer.emiDate == 11
      ? "11th"
      : customer.emiDate == 21
      ? "21st"
      : customer.emiDate}
  </span>

  {customer.status === "Completed" ? (
    <span className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
      ✅ Completed
    </span>
  ) : (
    <span className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
      Active
    </span>
  )}

  {isAdmin && customer.removeMark && (
    <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
      🚫 Deleted
    </span>
  )}
</div>

  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
    <p>
      <span className="font-semibold">Name:</span> {customer.customerName}
    </p>

    <p>
      <span className="font-semibold">Mobile:</span> {customer.mobile}
    </p>

    <p>
      <span className="font-semibold">Paid:</span> {customer.paidEmi}/{customer.numberOfEmi}
    </p>

    <p className="text-green-600 font-bold">
      EMI: ₹{customer.emiAmount.toLocaleString("en-IN")}
    </p>
  </div>

  <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-end">
    <button
      onClick={() => router.push(`/customer/${customer.customerId}`)}
      className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
    >
      More Details
    </button>

    <button
      onClick={() =>
        router.push(`/customer/${customer.customerId}/payments`)
      }
      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
    >
      Payment Board
    </button>
  </div>
</div>
      ))
    ) : (
      <div className="bg-white rounded-xl shadow p-8 text-center text-slate-500">
        No Customers Found
      </div>
    )}

  </div>
</div>
<ScrollUp/>
</>
  );
}