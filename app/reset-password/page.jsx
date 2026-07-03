"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
          newPassword:password,
        }),
      });

      const data = await res.json();

      if (res?.ok && data) {
        toast.success(data.message);

        setTimeout(() => {
          router.replace("/login");
        }, 1500);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F8FC] flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-8">

        <h1 className="text-3xl font-bold text-center text-sky-900">
          Reset Password
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Create a new password for your account.
        </p>

        <form
          onSubmit={handleReset}
          className="mt-8 space-y-5"
        >

          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() =>
                setShowPassword(!showPassword)
              }
              className="accent-emerald-600"
            />
            Show Password
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>

        </form>

      </div>

    </div>
  );
}