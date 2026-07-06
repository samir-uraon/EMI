"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


export default function LoanForm() {
	const router = useRouter();
  const [previewImage, setPreviewImage] = useState(null);

const { status } = useSession({
  required: true,
  onUnauthenticated() {
    router.replace("/login");
  },
});
  const [loading, setLoading] = useState(false);




  const [form, setForm] = useState({
  customerName: "",
  mobile: "",
  altMobile: "",
  productName: "",
 productPhoto: [],
  customerIdProof: [],   // New field
  address: "",
  productPrice: "",
  downPayment: "",
  financeAmount: "",
  emiAmount: "",
  numberOfEmi: "",
  emiDate: "",
 emiStartMonth: "",
  emiStartYear: "",
});

  const handleChange = (e) => {
  const { name, files } = e.target;

  const selectedFiles = Array.from(files);

  const allowedTypes = ["image/png", "image/jpeg"];

  for (const file of selectedFiles) {
    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG, JPG and JPEG files are allowed.");
      e.target.value = "";
      return;
    }
  }

  setForm((prev) => {
    const oldFiles = prev[name] || [];

    // Maximum 2 files
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

  // Clear input
  e.target.value = "";
};



const handleSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);

  const formData = new FormData();

  Object.entries(form).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Append each selected file
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

      // Reset form
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
        emiDate: "",
        emiStartMonth: "",
        emiStartYear: "",
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

const removeFile = (field, index) => {
  setForm((prev) => ({
    ...prev,
    [field]: prev[field].filter((_, i) => i !== index),
  }));
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
  if (e.key === "Enter") {
    e.preventDefault();

    const form = e.target.form;
    const index = Array.prototype.indexOf.call(form, e.target);

    if (form.elements[index + 1]) {
      form.elements[index + 1].focus();
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

    {/* Back Button */}
    <button
      onClick={() => router.push("/")}
      className="mb-4 flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-gray-700 px-4 py-2 rounded-lg transition"
    >
      ← Back
    </button>

    {/* Form Card */}
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Add Loan
      </h2>


        <form onSubmit={handleSubmit}
        onKeyDown={handleKeyDown} 
        className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Customer Name */}
          <div>
            <label className="font-medium">Customer Name<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1 text-black"
              autoFocus
              onKeyDown={handleKeyDown}
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="font-medium">Mobile Number<span className="text-red-500">*</span></label>
            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              minLength={10}
              className="w-full border rounded-lg p-2 mt-1 text-black"
              onKeyDown={handleKeyDown}
              required
            />
          </div>

          {/* Alternate Mobile */}
          <div>
            <label className="font-medium">
              Alternate Mobile (Optional)
            </label>
            <input
              type="tel"
              name="altMobile"
              value={form.altMobile}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1 text-black"
            />
          </div>

          {/* Product Name */}
          <div>
            <label className="font-medium">Product Name<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="productName"
              value={form.productName}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1 text-black"
              required
            />
          </div>

          {/* Product Photo */}
          <div className="md:col-span-2">
            <label className="font-medium">
              Product Photo (Optional)
            </label>
<input
  type="file"
  name="productPhoto"
  accept=".png,.jpg,.jpeg"
  multiple
  onChange={handleChange}
  className="w-full border rounded-lg p-2 mt-1 text-black"
/>

{form.productPhoto?.length > 0 && (
  <div className="mt-3 space-y-2">
    {form.productPhoto.map((file, index) => (
      <div
        key={index}
        className="flex items-center justify-between border rounded-lg p-2 bg-gray-50"
      >
        <span className="truncate text-sm">{file.name}</span>

        <div className="flex gap-2">
          <button
            type="button"
          onClick={() => setPreviewImage(URL.createObjectURL(file))}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View
          </button>

          <button
            type="button"
            onClick={() => removeFile("productPhoto", index)}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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
            <label className="font-medium">Address<span className="text-red-500">*</span></label>
            <textarea
              rows="3"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1 text-black"
            />
          </div>

          {/* Product Price */}
          <div>
            <label className="font-medium">Product Price (₹)<span className="text-red-500">*</span></label>
            <input
              type="number"
              name="productPrice"
              value={form.productPrice}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1 text-black"
              required
            />
          </div>

          {/* Down Payment */}
          <div>
            <label className="font-medium">Down Payment (₹) (Optional)</label>
            <input
              type="number"
              name="downPayment"
              value={form.downPayment}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1 text-black"
            />
          </div>

          {/* Finance Amount */}
          <div>
            <label className="font-medium">Finance Amount (₹)<span className="text-red-500">*</span></label>
            <input
              type="number"
              readOnly
              name="financeAmount"
              onKeyDown={handleKeyDown}
              value={form.financeAmount}
              //onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1 text-black bg-gray-400 cursor-not-allowed"
              placeholder="Auto Calculate"
            />
          </div>

          {/* EMI Amount */}
          <div>
            <label className="font-medium">EMI Amount (₹)<span className="text-red-500">*</span></label>
            <input
              type="number"
              name="emiAmount"
              value={form.emiAmount}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1 text-black"
              required
            />
          </div>

          {/* Number of EMI */}
        <div>
  <label className="font-medium">
    Number of EMI <span className="text-red-500">*</span>
  </label>

  <select
    name="numberOfEmi"
    value={form.numberOfEmi}
    onChange={handleChange}
    className="w-full border rounded-lg p-2 mt-1 text-black"
    required
  >
    <option value="">Select How Many</option>
    {Array.from({ length: 12 }, (_, i) => (
      <option key={i + 1} value={i + 1}>
        {i + 1}
      </option>
    ))}
  </select>
</div>

  {/* EMI Date */}
          <div>
  <label className="font-medium">EMI Due Date<span className="text-red-500">*</span></label>

  <select
    name="emiDate"
    value={form.emiDate}
    onChange={handleChange}
    className="w-full border rounded-lg p-2 mt-1 text-black"
    required
  >
    <option value="">Select EMI Date</option>
    <option value="1">1st</option>
    <option value="11">11th</option>
    <option value="21">21st</option>
  </select>
</div>


  {/* Month */}
  <div>
    <label className="font-medium">
      EMI Start Month <span className="text-red-500">*</span>
    </label>

    <select
      name="emiStartMonth"
      value={form.emiStartMonth}
      onChange={handleChange}
      className="w-full border rounded-lg p-2 mt-1 text-black"
      required
    >
      <option value="">Select Month</option>
      {[
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ].map((month, index) => (
        <option key={index} value={index + 1}>
          {month}
        </option>
      ))}
    </select>
  </div>

  {/* Year */}
<div>
  <label className="font-medium">
    EMI Start Year <span className="text-red-500">*</span>
  </label>

  <select
    name="emiStartYear"
    value={form.emiStartYear}
    onChange={handleChange}
    className="w-full border rounded-lg p-2 mt-1 text-black"
    required
  >
    <option value="">Select Year</option>

    {Array.from(
      { length: new Date().getFullYear() + 10 - 2000 + 1 },
      (_, i) => {
        const year = 2000 + i;
        return (
          <option key={year} value={year}>
            {year}
          </option>
        );
      }
    )}
  </select>
</div>

          {/* Customer ID Proof */}
<div className="md:col-span-2">
  <label className="font-medium">
    Customer ID Proof<span className="text-red-500">*</span>
  </label>

<input
  type="file"
  name="customerIdProof"
  accept=".png,.jpg,.jpeg"
  multiple
  onChange={handleChange}
  className="w-full border rounded-lg p-2 mt-1 text-black"
/>

{form.customerIdProof?.length > 0 && (
  <div className="mt-3 space-y-2">
    {form.customerIdProof.map((file, index) => (
      <div
        key={index}
        className="flex items-center justify-between border rounded-lg p-2 bg-gray-50"
      >
        <span className="truncate text-sm">{file.name}</span>

        <div className="flex gap-2">
          <button
            type="button"
  onClick={() => setPreviewImage(URL.createObjectURL(file))}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View
          </button>

          <button
            type="button"
            onClick={() => removeFile("customerIdProof", index)}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
)}

  <p className="text-sm text-gray-500 mt-1">
    Upload Aadhaar Card, PAN Card, Voter ID, Driving License or Passport.
  </p>
</div>

    {previewImage && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    onClick={() => setPreviewImage(null)}
  >
    <div className="relative">
      <img
        src={previewImage}
        alt="Preview"
        className="max-w-[90vw] max-h-[90vh] rounded-lg"
      />

      <button
        type="button"
        onClick={() => setPreviewImage(null)}
        className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded"
      >
        ✕
      </button>
    </div>
  </div>
)}      

          {/* Button */}
          <div className="md:col-span-2">
          <button
  type="submit"
  disabled={loading}
  className={`w-full py-3 rounded-lg text-white font-semibold transition ${
    loading
      ? "bg-blue-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {loading ? (
    <span className="flex items-center justify-center gap-2">
      <svg
        className="w-5 h-5 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
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