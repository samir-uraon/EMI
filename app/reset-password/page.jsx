"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!token) {
      return toast.error("Invalid or expired reset link.");
    }

    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters.");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/resetpassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Password reset successful!");

        setTimeout(() => {
          router.replace("/login");
        }, 1500);
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-emerald-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-8">

        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <h1 className="mt-5 text-center text-3xl font-bold text-slate-800">
          Reset Password
        </h1>

        <p className="mt-2 text-center text-gray-500 text-sm">
          Enter your new password below.
        </p>

        <form
          onSubmit={handleReset}
          className="mt-8 space-y-5"
        >
          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-black outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-black outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <p className="text-xs text-gray-500">
            Password must contain at least{" "}
            <span className="font-semibold">
              8 characters
            </span>.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div className="mt-8 border-t pt-5 text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            ← Back to Login
          </button>
        </div>

      </div>

    </div>
  );
}