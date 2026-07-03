"use client";

import { useEffect, useState } from "react";

export default function ScrollUp() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {showButton && (
       <button
  onClick={scrollToTop}
className="fixed bottom-40 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-300 hover:scale-110 animate-bounce"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 15l7-7 7 7"
    />
  </svg>
</button>
      )}
    </>
  );
}