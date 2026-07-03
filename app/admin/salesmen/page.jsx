"use client";

import { useState, useEffect } from "react";
import { Search, User, Phone, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserSearchPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
const router = useRouter();

  useEffect(() => {
      fetchUsers();

  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/me`);
      const data = await res.json();
      const filteredUsers = data.salesmen?.filter((user) => {
  const keyword = search.toLowerCase();

  return (
    user?.name?.toLowerCase().includes(keyword) ||
    user?.phone?.toString().includes(keyword)
  );
});

      setUsers(filteredUsers);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-gray-500">
      <div className="max-w-6xl mx-auto">
          {/* Back Button */}
    <button
      onClick={() => router.back()}
      className="mb-4 flex items-center shadow gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
    >
      ← Back
    </button>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Search Salesmen
          </h1>

          <p className="text-slate-500 mt-2">
            Search by Name , Phone
          </p>
        </div>

        {/* Search Box */}
        <div className="relative mb-8">

          <Search
            size={22}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search salesmen..."
            className="w-full rounded-xl border border-slate-300 bg-white py-4 pl-12 pr-4 text-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {/*Loading */}
        {loading && (
          <div className="text-center py-3 text-gray-500">
            Searching...
          </div>
        )}

        {/* Empty */}
        {!loading && users.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow">

            <Search
              size={50}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 text-slate-500">
              No customer found
            </p>

          </div>
        )}

        {/* Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {users.map((user) => (
    <div
      key={user._id}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-5"
    >
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-5">

        {/* User Details */}
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <User size={20} className="text-blue-600" />
            {user?.name}
          </h2>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-blue-500" />
              <span className="font-medium">Phone:</span>
              {user?.phone || "N/A"}
            </p>

            <p className="flex items-center gap-2 break-all">
              <CreditCard size={16} className="text-blue-500" />
              <span className="font-medium">ID:</span>
              {user?._id}
            </p>

            <p className="text-sm">
              <span className="font-medium">Created:</span>{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col w-full lg:w-44 gap-3">
          <button
            onClick={() => router.push(`/admin/${user._id}/salesmen`)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95"
          >
            💼 Work
          </button>

          <button
            onClick={() => router.push(`/admin/${user._id}/Loans`)}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 active:scale-95"
          >
            📄 View Loans ({user?.loans?.length || 0})
          </button>
        </div>

      </div>
    </div>
  ))}
</div>

      </div>
    </div>
  );
}