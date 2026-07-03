"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/forgotpassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: identifier }),
      });

      const data = await res.json();
      
      if (res?.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error||"Error");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
						setIdentifier("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8FC] flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-8">

        <h1 className="text-3xl font-bold text-center text-sky-900">
          Forgot Password
        </h1>

        <p className="mt-3 text-center text-gray-500">
          Enter your registered Email to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter your registered Email"
            required
            autoComplete="username"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </button>

        </form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>

      </div>

    </div>
  );
}