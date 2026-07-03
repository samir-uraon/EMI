"use client";

import { useState } from "react";

export default function PaymentBoard() {
  const [payments, setPayments] = useState([
    {
      emiNo: 1,
      dueDate: "2026-07-01",
      paidDate: "2026-07-01",
      amount: 3500,
      status: "Paid",
      fine: 0,
      paymentMode: "Cash",
      remarks: "",
    },
    {
      emiNo: 2,
      dueDate: "2026-08-01",
      paidDate: "",
      amount: 3500,
      status: "Pending",
      fine: 0,
      paymentMode: "",
      remarks: "",
    },
    {
      emiNo: 3,
      dueDate: "2026-09-01",
      paidDate: "",
      amount: 3500,
      status: "Pending",
      fine: 0,
      paymentMode: "",
      remarks: "",
    },
    {
      emiNo: 4,
      dueDate: "2026-10-01",
      paidDate: "",
      amount: 3500,
      status: "Pending",
      fine: 0,
      paymentMode: "",
      remarks: "",
    },
  ]);

  const handleChange = (index, field, value) => {
    const updated = [...payments];
    updated[index][field] = value;
    setPayments(updated);
  };

  const handleSave = () => {
    console.log(payments);
    alert("Payments Updated Successfully");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Payment Board
        </h2>

        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          Save Changes
        </button>
      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full border border-slate-300">

          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="border p-3">EMI</th>
              <th className="border p-3">Due Date</th>
              <th className="border p-3">Paid Date</th>
              <th className="border p-3">Amount</th>
              <th className="border p-3">Status</th>
              <th className="border p-3">Fine</th>
              <th className="border p-3">Mode</th>
              <th className="border p-3">Remarks</th>
            </tr>
          </thead>

          <tbody>

            {payments.map((payment, index) => (
              <tr key={payment.emiNo} className="hover:bg-slate-50">

                <td className="border p-3 text-center font-semibold">
                  {payment.emiNo}
                </td>

                <td className="border p-3 text-center">
                  {payment.dueDate}
                </td>

                <td className="border p-2">
                  <input
                    type="date"
                    value={payment.paidDate}
                    onChange={(e) =>
                      handleChange(index, "paidDate", e.target.value)
                    }
                    className="w-full border rounded-md p-2"
                  />
                </td>

                <td className="border p-3 text-center font-semibold text-green-600">
                  ₹{payment.amount.toLocaleString("en-IN")}
                </td>

                <td className="border p-2">
                  <select
                    value={payment.status}
                    onChange={(e) =>
                      handleChange(index, "status", e.target.value)
                    }
                    className={`w-full rounded-md border p-2 font-medium ${
                      payment.status === "Paid"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : payment.status === "Late"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : "bg-yellow-100 text-yellow-700 border-yellow-300"
                    }`}
                  >
                    <option value="Pending">🟡 Pending</option>
                    <option value="Paid">🟢 Paid</option>
                    <option value="Late">🔴 Late</option>
                  </select>
                </td>

                <td className="border p-2">
                  <input
                    type="number"
                    value={payment.fine}
                    onChange={(e) =>
                      handleChange(index, "fine", e.target.value)
                    }
                    className="w-24 border rounded-md p-2"
                  />
                </td>

                <td className="border p-2">
                  <select
                    value={payment.paymentMode}
                    onChange={(e) =>
                      handleChange(index, "paymentMode", e.target.value)
                    }
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">Select</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank</option>
                  </select>
                </td>

                <td className="border p-2">
                  <input
                    type="text"
                    placeholder="Remarks"
                    value={payment.remarks}
                    onChange={(e) =>
                      handleChange(index, "remarks", e.target.value)
                    }
                    className="w-full border rounded-md p-2"
                  />
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}