"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    confirmPassword: "",
  });

const loginText =
  "Sign in to manage your loans and EMI payments securely.";

const signupText =
  "Create an account to start managing loans and EMIs.";
const text = isSignup ? signupText : loginText;

const [typedText, setTypedText] = useState("");

useEffect(() => {
  let index = 0;
  let deleting = false;
  let timeout;

  const type = () => {
    if (!deleting) {
      setTypedText(text.slice(0, index + 1));
      index++;

      if (index <= text.length) {
        timeout = setTimeout(type, 45);
      } else {
        deleting = true;
        timeout = setTimeout(type, 2500);
      }
    } else {
      setTypedText(text.slice(0, index - 1));
      index--;

      if (index >= 0) {
        timeout = setTimeout(type, 20);
      } else {
        deleting = false;
        timeout = setTimeout(type, 1200);
      }
    }
  };

  setTypedText(""); // Reset when switching between Login and Signup
  type();

  return () => clearTimeout(timeout);
}, [text]);

  function validateIdentifier(identifier) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(identifier)) {
      return { valid: true, type: "email" };
    }
    return {
      valid: false,
      message: "Please enter a valid email address.",
    };
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.ok) {
        toast.success("Login Successful");
        router.push("/");
        return;
      }

     if (result?.error) {
          toast.error(result?.error || "Login Failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      toast.success("Account Created !")
setForm((prev) => ({
  ...prev,
  name: "",
  password: "",
  confirmPassword: "",
}));      setIsSignup(false);
						
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading) return;

    const { valid, message } = validateIdentifier(form.email);
    if (!valid) {
      toast.error(message || "Invalid Input");
      return;
    }

    if (isSignup) {
      handleSignup();
    } else {
      handleLogin();
    }
  };

const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const form = e.target.form;
    const index = Array.prototype.indexOf.call(form, e.target);

    if (form.elements[index + 1]) {
      form.elements[index + 1].focus();
    }
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12 sm:px-6 lg:px-8">
     <div className="absolute left-4 top-4 ">

  {/* Back Button */}
    <button
      onClick={() => router.push("/")}
      className=" flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
    >
      ← Back
    </button>
    </div>

					 <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6  sm:p-10">
        <h1 className="text-2xl font-bold text-sky-900 text-center mb-1">
          {isSignup ? "Create Your Account" : "Welcome to EMI World"}
        </h1>
        
        <p className="text-sm text-gray-500 text-center min-h-[40px] mb-3 px-4">
          {typedText}
        </p>

        <form onSubmit={handleSubmit}
        onKeyDown={handleKeyDown} 
        className="space-y-5">
          {isSignup && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              required
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black text-sm sm:text-base focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Enter your email address"
            value={form.email}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            required           
            autoFocus
            autoComplete={"username"}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black text-sm sm:text-base focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200"
          />
            {isSignup && (
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              required
          
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black text-sm sm:text-base focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200"
            />
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black text-sm sm:text-base focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200"
            />
          </div>

          {isSignup && (
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              required
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black text-sm sm:text-base focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-200"
            />
          )}

          <div className="flex justify-between items-center px-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="accent-emerald-600 rounded"
              />
              Show Password
            </label>

            {!isSignup && (
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
              >
                Forgot Password?
              </Link>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-white font-semibold transition hover:bg-emerald-700 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {isSignup ? "Creating..." : "Logging in..."}
              </>
            ) : isSignup ? (
              "Create Account"
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="flex-1 h-px bg-gray-200"></span>
          <span className="text-xs text-gray-400 font-medium tracking-wider">OR</span>
          <span className="flex-1 h-px bg-gray-200"></span>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 transition hover:bg-gray-200 active:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.1 29.2 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z" />
            <path fill="#4CAF50" d="M24 44c5.1 0 9.8-1.9 13.4-5.1l-6.2-5.2C29.2 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.6 5.8-7.1 7.2l6.2 5.2C38.3 37.1 44 31.2 44 24c0-1.3-.1-2.5-.4-3.5z" />
          </svg>
          <span className="font-medium text-gray-700 text-sm sm:text-base">
            Continue with Google
          </span>
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsSignup(false)}
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition ml-1"
              >
                Login
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setIsSignup(true)}
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition ml-1"
              >
                Create Account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}