"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, User, IdCard, CircleDollarSign, Plus, Trash2, Edit2, Save, X, Loader2, Package } from 'lucide-react';
import ScrollUp from "@/components/ScrollUp";
import { useSession } from "next-auth/react";

export default function EditCustomer() {
  const { customerID } = useParams();
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [initialForm, setInitialForm] = useState(null);

  // Hidden file input refs
  const idProofInputRef = useRef(null);
  const productPhotoInputRef = useRef(null);
  const replaceIndexRef = useRef({ type: null, index: null });

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    altMobile: "",
    address: "",
    productName: "",
    productPrice: "",
    downPayment: "",
    financeAmount: 0,
    emiAmount: "",
    numberOfEmi: "",
    emiDate: "",
    emiMonth: "",
    emiYear: "",
    customerIdProof: [],
    productPhoto: [],
  });

  const months = [
    { value: "01", label: "January" }, { value: "02", label: "February" },
    { value: "03", label: "March" }, { value: "04", label: "April" },
    { value: "05", label: "May" }, { value: "06", label: "June" },
    { value: "07", label: "July" }, { value: "08", label: "August" },
    { value: "09", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);

  useEffect(() => {
    if (customerID) {
      fetchLoan();
    }
  }, [customerID]);

  const fetchLoan = async () => {
    try {
      const res = await fetch(`/api/customer/${customerID}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch data");

      const loan = data.loan || data;
      const firstPaymentDate = loan.payments?.[0]?.dueDate;
      const dueDate = firstPaymentDate ? new Date(firstPaymentDate) : new Date();

      const fetchedData = {
        customerName: loan.customerName || "",
        mobile: loan.mobile || "",
        altMobile: loan.altMobile || "",
        address: loan.address || "",
        productName: loan.productName || "",
        productPrice: loan.productPrice || "",
        downPayment: loan.downPayment || "",
        financeAmount: Number(loan.productPrice || 0) - Number(loan.downPayment || 0),
        emiAmount: loan.emiAmount || "",
        numberOfEmi: loan.numberOfEmi || "",
        emiDate: loan.emiDate || "",
        emiMonth: String(dueDate.getMonth() + 1).padStart(2, "0"),
        emiYear: String(dueDate.getFullYear()),
        customerIdProof: Array.isArray(loan.customerIdProof)
          ? loan.customerIdProof
          : loan.customerIdProof ? [loan.customerIdProof] : [],
        productPhoto: Array.isArray(loan.productPhoto)
          ? loan.productPhoto
          : loan.productPhoto ? [loan.productPhoto] : [],
      };

      setForm(fetchedData);
      setInitialForm(fetchedData);
    } catch (err) {
      toast.error(err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const isUnchanged = JSON.stringify(form) === JSON.stringify(initialForm);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "productPrice" || name === "downPayment") {
        updated.financeAmount = Number(updated.productPrice || 0) - Number(updated.downPayment || 0);
      }
      return updated;
    });
  };

  // Utility to convert file uploads to Base64 strings seamlessly
  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional client-side verification
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      
      setForm((prev) => {
        const fieldName = type === "idProof" ? "customerIdProof" : "productPhoto";
        let updatedArr = [...prev[fieldName]];

        if (replaceIndexRef.current.index !== null && replaceIndexRef.current.type === type) {
          // Replace operation
          updatedArr[replaceIndexRef.current.index] = base64String;
        } else {
          // Add new operation
          if (updatedArr.length < 2) {
            updatedArr.push(base64String);
          }
        }

        return { ...prev, [fieldName]: updatedArr };
      });

      // Clear structural reference pointers
      replaceIndexRef.current = { type: null, index: null };
      e.target.value = ""; 
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (type, index = null) => {
    replaceIndexRef.current = { type, index };
    if (type === "idProof") {
      idProofInputRef.current?.click();
    } else {
      productPhotoInputRef.current?.click();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/customer/${customerID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update details.');

      toast.success('Changes saved successfully!');
      setInitialForm(form);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-2">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-md text-gray-500 font-medium">Loading customer file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-md bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      
      {/* Hidden File System Inputs */}
      <input 
        type="file" 
        ref={idProofInputRef} 
        onChange={(e) => handleFileChange(e, "idProof")} 
      accept=".jpg,.jpeg,.png,.pdf" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={productPhotoInputRef} 
        onChange={(e) => handleFileChange(e, "productPhoto")} 
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden" 
      />

      <div className="max-w-full mx-auto space-y-6">

        {/* Header Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 px-7 shadow-sm flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/customer/${customerID}`)}
            className="p-2 hover:bg-gray-300 rounded-full transition-colors flex items-center justify-center gap-1 text-md font-medium"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            Back
          </button>

          <div className="text-right">
            <h1 className="text-lg font-semibold text-gray-900 flex items-center justify-end gap-2">
              <Edit2 className="w-4 h-4 text-blue-500" /> Edit Customer & Loan
            </h1>
            <p className="text-xs text-gray-500">Update customer, product and EMI details.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* 1. Customer Details */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2 font-medium text-gray-700">
              <User className="w-4 h-4 text-gray-500" /> Customer Details
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
                  <input type="text" name="customerName" value={form.customerName} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
                  <input type="text" name="mobile" value={form.mobile} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alternate Mobile</label>
                  <input type="text" name="altMobile" value={form.altMobile} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <textarea name="address" rows="3" value={form.address} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Product Details */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2 font-medium text-gray-700">
              <Package className="w-4 h-4 text-gray-500" /> Product Purchase Info
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                  <input type="text" name="productName" value={form.productName} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product Price</label>
                  <input type="number" name="productPrice" value={form.productPrice} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Down Payment</label>
                  <input type="number" name="downPayment" value={form.downPayment} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Calculated Finance Amount</label>
                  <div className="w-full bg-gray-100 text-md font-semibold border border-gray-300 rounded-lg px-3 py-2 text-gray-700">
                    {form.financeAmount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ID Proof */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-gray-500" /> ID Proof (Max 2)
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                {form.customerIdProof.map((photo, index) => (
                  <div key={index} className="w-36 h-44 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between p-2 group relative">
                    <div className="flex-1 relative rounded border border-dashed border-gray-200 mb-2 overflow-hidden group/thumb">
                      {photo ? (
                        <>
                          <img
                            src={photo}
                            alt={`ID Proof ${index + 1}`}
                            className="w-full h-full object-cover transition-all duration-300 brightness-50 sm:brightness-100 sm:group-hover/thumb:brightness-50"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 sm:bg-transparent opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity duration-300">
                              <button
  type="button"
  onClick={() => setPreviewImage(photo)}
              className="bg-white text-gray-800 text-xs px-2.5 py-1.5 rounded-md shadow font-semibold hover:bg-gray-100 transition-colors"
            >
              👁 View
            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                          Image {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <button 
                        type="button" 
                        onClick={() => triggerUpload("idProof", index)}
                        className="w-full text-[11px] font-medium text-gray-600 hover:text-blue-700 flex items-center justify-center gap-1 py-0.5 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            customerIdProof: prev.customerIdProof.filter((_, i) => i !== index)
                          }));
                        }}
                        className="w-full text-[11px] font-medium text-red-600 hover:text-red-800 flex items-center justify-center gap-1 py-0.5 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}

                {form.customerIdProof.length < 2 && (
                  <button 
                    type="button" 
                    onClick={() => triggerUpload("idProof")}
                    className="w-36 h-44 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs font-medium text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors bg-gray-50/50"
                  >
                    <Plus className="w-5 h-5 mb-1" /> Add ID Proof
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Product Photos Sub-section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Product Photos (Max 2)</label>
            <div className="flex flex-wrap gap-4 items-center">
              {form.productPhoto.map((photo, index) => (
                <div key={index} className="w-36 h-44 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between p-2 group relative">
                  <div className="flex-1 relative rounded border border-dashed border-gray-200 mb-2 overflow-hidden group/thumb">
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt={`Product Photo ${index + 1}`}
                          className="w-full h-full object-cover transition-all duration-300 brightness-50 sm:brightness-100 sm:group-hover/thumb:brightness-50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 sm:bg-transparent opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity duration-300">
                  <button
  type="button"
  onClick={() => setPreviewImage(photo)}
              className="bg-white text-gray-800 text-xs px-2.5 py-1.5 rounded-md shadow font-semibold hover:bg-gray-100 transition-colors"
            >
              👁 View
            </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                        Photo {index + 1}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <button 
                      type="button" 
                      onClick={() => triggerUpload("productPhoto", index)}
                      className="w-full text-[11px] font-medium text-gray-600 hover:text-blue-600 flex items-center justify-center gap-1 py-0.5 hover:bg-gray-50 rounded transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          productPhoto: prev.productPhoto.filter((_, i) => i !== index)
                        }));
                      }}
                      className="w-full text-[11px] font-medium text-red-600 hover:text-red-700 flex items-center justify-center gap-1 py-0.5 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ))}

              {form.productPhoto.length < 2 && (
                <button 
                  type="button" 
                  onClick={() => triggerUpload("productPhoto")}
                  className="w-36 h-44 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs font-medium text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors bg-gray-50/50"
                >
                  <Plus className="w-5 h-5 mb-1" /> Add Product Photo
                </button>
              )}
            </div>
          </div>

          {/* 5. Loan Details */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2 font-medium text-gray-700">
              <CircleDollarSign className="w-4 h-4 text-gray-500" /> Loan Details
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">EMI Amount</label>
                  <input type="number" name="emiAmount" value={form.emiAmount} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Number of EMI</label>
                  <input type="number" name="numberOfEmi" value={form.numberOfEmi} onChange={handleChange} className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">EMI Due Day</label>
                  <select
                    name="emiDate"
                    value={form.emiDate}
                    onChange={handleChange}
                    className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Select Due Day</option>
                    <option value="1">1st</option>
                    <option value="11">11th</option>
                    <option value="21">21st</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">EMI Start Month</label>
                  <select
                    name="emiMonth"
                    value={form.emiMonth}
                    onChange={handleChange}
                    className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select Month</option>
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">EMI Start Year</label>
                  <select
                    name="emiYear"
                    value={form.emiYear}
                    onChange={handleChange}
                    className="w-full text-md border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select Year</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-md font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={isUnchanged}
              className="px-5 py-2 text-md font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/10"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>

        </form>
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

      <ScrollUp />
    </div>
  );
}