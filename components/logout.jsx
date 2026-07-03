"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}    
className="w-full mt-2 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition duration-200">
      Logout
    </button>
  );
}