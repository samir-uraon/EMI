"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function EmiCalculator() {

	const router=useRouter()
  const [loan, setLoan] = useState("");
const [interest, setInterest] = useState("");
const [months, setMonths] = useState("");
const testref=useRef(null)
const [emi, setEmi] = useState(0);
const [interestAmount, setInterestAmount] = useState(0);
const [totalAmount, setTotalAmount] = useState(0);

const formatIndianNumber = (value) => {
  if (!value) return "";

  const num = value.replace(/,/g, "");

  if (!/^\d*$/.test(num)) return loan;

  return Number(num).toLocaleString("en-IN");
};

const handleLoanChange = (e) => {
  const value = e.target.value.replace(/,/g, "");
  if (/^\d*$/.test(value)) {
    setLoan(formatIndianNumber(value));
				clearResult()
  }
};

useEffect(() => {
  if (emi > 0) {
    testref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [emi]);


  const calculateEMI = () => {
  const P = Number(loan.replace(/,/g, ""));
  const R = Number(interest) / 12 / 100;
  const N = Number(months);

  if (P <= 0 || R <= 0 || N <= 0) {
    alert("Please enter valid values.");
    return;
  }

  const emiValue =
    (P * R * Math.pow(1 + R, N)) /
    (Math.pow(1 + R, N) - 1);

  const total = emiValue * N;
  const totalInterest = total - P;

  setEmi(Math.round(emiValue));
  setInterestAmount(Math.round(totalInterest));
  setTotalAmount(Math.round(total));
};

const resetCalculator = () => {
  setLoan("");
  setInterest("");
  setMonths("");

  setEmi(0);
  setInterestAmount(0);
  setTotalAmount(0);
};

const clearResult = () => {
  setEmi(0);
  setInterestAmount(0);
  setTotalAmount(0);
};

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-6 text-gray-600">
					  <button
    onClick={() => router.back()}
    className="absolute left-4 top-3 shadow bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition"
  >
    ← Back
  </button>
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-xl p-8">

        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">
          EMI Calculator
        </h1>

        <div className="space-y-5">

          <div>
            <label className="font-medium">
              Loan Amount (₹)
            </label>

            <input
  type="text"
  value={loan}
  onChange={handleLoanChange}
  className="w-full mt-2 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
  placeholder="5,00,000"
autoFocus
/>
          </div>

          <div>
            <label className="font-medium">
              Interest Rate (%)
            </label>

            <input
              type="number"
											
              value={interest}
              onChange={(e) => {setInterest(e.target.value)
															clearResult()
														}}
              className="w-full mt-2 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="8.5"
            />
          </div>

          <div>
        
  <label className="font-medium">
    Loan Tenure (Months)
  </label>
<input
  type="number"
  value={months}
  onChange={(e) => {setMonths(e.target.value)
			clearResult()
		}}
  min="1"
		max="12"
  className="w-full mt-2 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
  placeholder="1"
/>

          </div>

         <div className="grid grid-cols-2 gap-4">

  <button
    onClick={calculateEMI}
    className="bg-indigo-600 hover:bg-indigo-700 text-white  rounded-xl font-semibold py-1 px-6"
  >
    Calculate EMI
  </button>

  <button
    onClick={resetCalculator}
    className="bg-red-500 hover:bg-red-600 text-white p-3  rounded-xl font-semibold"
  >
    Reset
  </button>

</div>

        </div>

        {emi > 0 && (
          <div className="mt-8 bg-slate-50 rounded-2xl p-6">

    <div className="flex justify-between py-3 border-b">
  <span>Total EMIs</span>
  <span className="font-bold text-blue-600">
    {months} Months
  </span>
</div>
            <div ref={testref} className="flex justify-between py-3 border-b">
              <span>Monthly EMI</span>
              <span className="font-bold text-indigo-600">
                ₹ {emi}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b">
              <span>Total Interest</span>
              <span className="font-bold text-red-500">
                ₹ {interestAmount}
              </span>
            </div>

            <div className="flex justify-between py-3">
              <span>Total Payment</span>
              <span className="font-bold text-green-600">
                ₹ {totalAmount}
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}