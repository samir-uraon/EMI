"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res.error) {
      router.push("/admin/dashboard");
    } else {
      alert("Invalid Credentials");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-black p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-6 text-center text-3xl font-bold">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded border p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-5 w-full rounded border p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full rounded bg-blue-600 py-3 font-semibold text-white"
        >
          {loading ? "Signing In..." : "Login"}
        </button>
      </form>
    </div>
  );
}