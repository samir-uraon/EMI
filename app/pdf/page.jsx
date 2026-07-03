"use client";

export default function GeneratePDF() {
  const handleGeneratePDF = async () => {
    const customer = {
      name: "Rahul Das",
      date: "03-07-2026",
      product: "Vivo V50",
      price: 22000,
      downPayment: 5000,
      balance: 17000,
      emiAmount: 1417,
      numberOfEmi: 12,

    };

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customer),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "EMI.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Unable to generate PDF");
    }
  };

  return (
    <div className="p-5">
      <button
        onClick={handleGeneratePDF}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Generate PDF
      </button>
    </div>
  );
}