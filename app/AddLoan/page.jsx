"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ScrollUp from "@/components/ScrollUp";

export default function LoanForm() {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    altMobile: "",
    productName: "",
    productPhoto: [],
    customerIdProof: [],
    address: "",
    productPrice: "",
    downPayment: "",
    financeAmount: "",
    emiAmount: "",
    numberOfEmi: "",
    emiDate: "",      // Due day parameter (1, 11, 21)
    emiStartDate: "", // Complete standard string format date picker string (YYYY-MM-DD)
  });

  // BACKGROUND WORKER: Computes smart calendar default allocations in HTML date format (YYYY-MM-DD)
  const getSmartDateDefaults = () => {
    const today = new Date();
    const currentDay = today.getDate();
    let defaultMonth = today.getMonth() + 1; 
    let defaultYear = today.getFullYear();

    if (currentDay > 21) {
      if (defaultMonth === 12) {
        defaultMonth = 1;
        defaultYear += 1; 
      } else {
        defaultMonth += 1;
      }
    }

    const fallbackDay = currentDay > 21 ? "01" : String(currentDay).padStart(2, "0");
    const formattedMonth = String(defaultMonth).padStart(2, "0");

    return `${defaultYear}-${formattedMonth}-${fallbackDay}`;
  };

  // Set initial date defaults automatically on component load
  useEffect(() => {
    const initialDate = getSmartDateDefaults();
    const currentDay = String(Number(initialDate.split("-")[2])); // Extract day without leading zeros

    setForm((prev) => ({
      ...prev,
      emiStartDate: initialDate,
      // Map initial day to dropdown if it hits standard cycles
      emiDate: ["1", "11", "21"].includes(currentDay) ? currentDay : "",
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    if (type !== "file") {
      setForm((prev) => {
        let updatedForm = { ...prev, [name]: value };

        // SYNC LOGIC 1: If user alters the Due Day select dropdown, adjust the calendar date picker's day matching it
        if (name === "emiDate" && value && prev.emiStartDate) {
          const dateParts = prev.emiStartDate.split("-"); // [YYYY, MM, DD]
          const paddedDay = String(value).padStart(2, "0");
          updatedForm.emiStartDate = `${dateParts[0]}-${dateParts[1]}-${paddedDay}`;
        }

        // SYNC LOGIC 2: If user manually changes the full date picker, recalculate and select standard dropdown cycles
        if (name === "emiStartDate" && value) {
          const selectedDay = String(Number(value.split("-")[2])); // Strip leading zero for comparison
          updatedForm.emiDate = ["1", "11", "21"].includes(selectedDay) ? selectedDay : "";
        }

        return updatedForm;
      });
      return;
    }

    const selectedFiles = Array.from(files || []);
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        alert("Only PNG, JPG and JPEG files are allowed.");
        e.target.value = "";
        return;
      }
    }

    setForm((prev) => {
      const oldFiles = prev[name] || [];

      if (oldFiles.length + selectedFiles.length > 2) {
        alert("Maximum 2 images are allowed.");
        e.target.value = "";
        return prev;
      }

      return {
        ...prev,
        [name]: [...oldFiles, ...selectedFiles],
      };
    });

    e.target.value = "";
  };

  const removeFile = (field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleOpenPreview = (file) => {
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
  };

  const handleClosePreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((file) => {
          formData.append(key, file);
        });
      } else {
        formData.append(key, value);
      }
    });

    try {
      const res = await fetch("/api/loan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Customer ID: ${data.loanId}`);

        const freshInitialDate = getSmartDateDefaults();
        const freshDay = String(Number(freshInitialDate.split("-")[2]));

        setForm({
          customerName: "",
          mobile: "",
          altMobile: "",
          productName: "",
          productPhoto: [],
          customerIdProof: [],
          address: "",
          productPrice: "",
          downPayment: "",
          financeAmount: "",
          emiAmount: "",
          numberOfEmi: "",
          emiDate: ["1", "11", "21"].includes(freshDay) ? freshDay : "",
          emiStartDate: freshInitialDate,
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const productPrice = Number(form.productPrice) || 0;
    const downPayment = Number(form.downPayment) || 0;
    const financeAmount = productPrice - downPayment;

    setForm((prev) => ({
      ...prev,
      financeAmount: financeAmount > 0 ? financeAmount : 0,
    }));
  }, [form.productPrice, form.downPayment]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.type !== "submit") {
      e.preventDefault();
      const currentForm = e.target.form;
      if (!currentForm) return;

      const index = Array.prototype.indexOf.call(currentForm.elements, e.target);
      if (currentForm.elements[index + 1]) {
        currentForm.elements[index + 1].focus();
      }
    }
  };

  if (status === "loading" || loading) {
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
    <div className="min-h-screen bg-gray-100 p-8 text-gray-500">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="mb-4 flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Add Loan</h2>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Name */}
            <div>
              <label className="font-medium text-gray-700">Customer Name<span className="text-red-500">*</span></label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
                autoFocus
                required
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="font-medium text-gray-700">Mobile Number<span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                minLength={10}
                maxLength={10}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
                required
              />
            </div>

            {/* Alternate Mobile */}
            <div>
              <label className="font-medium text-gray-700">Alternate Mobile (Optional)</label>
              <input
                type="tel"
                name="altMobile"
                value={form.altMobile}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
              />
            </div>

            {/* Product Name */}
            <div>
              <label className="font-medium text-gray-700">Product Name<span className="text-red-500">*</span></label>
              <input
                type="text"
                name="productName"
                value={form.productName}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
                required
              />
            </div>

            {/* Product Photo */}
            <div className="md:col-span-2">
              <label className="font-medium text-gray-700">Product Photo (Optional)</label>
              <input
                type="file"
                name="productPhoto"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
              />

              {form.productPhoto?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.productPhoto.map((file, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg p-2 bg-gray-50">
                      <span className="truncate text-sm text-gray-700">{file.name}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(file)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile("productPhoto", index)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="font-medium text-gray-700">Address<span className="text-red-500">*</span></label>
              <textarea
                rows="3"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
                required
              />
            </div>

            {/* Product Price */}
            <div>
              <label className="font-medium text-gray-700">Product Price (₹)<span className="text-red-500">*</span></label>
              <input
                type="number"
                name="productPrice"
                value={form.productPrice}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
                required
              />
            </div>

            {/* Down Payment */}
            <div>
              <label className="font-medium text-gray-700">Down Payment (₹) (Optional)</label>
              <input
                type="number"
                name="downPayment"
                value={form.downPayment}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
              />
            </div>

            {/* Finance Amount */}
            <div>
              <label className="font-medium text-gray-700">Finance Amount (₹)<span className="text-red-500">*</span></label>
              <input
                type="number"
                readOnly
                name="financeAmount"
                value={form.financeAmount}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-gray-200 cursor-not-allowed"
                placeholder="Auto Calculate"
              />
            </div>

            {/* EMI Amount */}
            <div>
              <label className="font-medium text-gray-700">EMI Amount (₹)<span className="text-red-500">*</span></label>
              <input
                type="number"
                name="emiAmount"
                value={form.emiAmount}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
                required
              />
            </div>

            {/* Number of EMI */}
            <div>
              <label className="font-medium text-gray-700">Number of EMI <span className="text-red-500">*</span></label>
              <select
                name="numberOfEmi"
                value={form.numberOfEmi}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
                required
              >
                <option value="">Select How Many</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            {/* EMI Due Date (Dropdown Selector) */}
            <div>
              <label className="font-medium text-gray-700">EMI Due Date<span className="text-red-500">*</span></label>
              <select
                name="emiDate"
                value={form.emiDate}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
                required
              >
                <option value="">Select Due Day</option>
                <option value="1">1st</option>
                <option value="11">11th</option>
                <option value="21">21st</option>
              </select>
            </div>

            {/* EMI Start Date (Calendar Date Picker) */}
            <div>
              <label className="font-medium text-gray-700">EMI Start Date<span className="text-red-500">*</span></label>
              <input
                type="date"
                name="emiStartDate"
                value={form.emiStartDate}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500 font-medium"
                required
              />
            </div>

            {/* Customer ID Proof */}
            <div className="md:col-span-2">
              <label className="font-medium text-gray-700">Customer ID Proof<span className="text-red-500">*</span></label>
              <input
                type="file"
                name="customerIdProof"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-black bg-white focus:outline-blue-500"
              />

              {form.customerIdProof?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.customerIdProof.map((file, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg p-2 bg-gray-50">
                      <span className="truncate text-sm text-gray-700">{file.name}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(file)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile("customerIdProof", index)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-400 mt-1">
                Upload formal verification documentation files (e.g. Identity validation paperwork).
              </p>
            </div>

            {/* Preview Overlay Modal */}
            {previewImage && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                onClick={handleClosePreview}
              >
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <img src={previewImage} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-lg" />
                  <button
                    type="button"
                    onClick={handleClosePreview}
                    className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white font-semibold transition ${
                  loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Adding Loan...
                  </span>
                ) : (
                  "Add Loan"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  
    </div>
  );
}