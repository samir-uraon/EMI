import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";

export async function POST(req) {
  try {
    let customer;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      customer = body.customer;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      customer = JSON.parse(params.get("customer"));
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      customer = JSON.parse(formData.get("customer"));
    }

    if (!customer) {
      return Response.json(
        { success: false, message: "Customer data missing" },
        { status: 400 }
      );
    }

    // Generate PDF...
    const pdfPath = path.join(process.cwd(), "public", "templates", "form.pdf");

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF template file missing at path: ${pdfPath}`);
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages.length > 1 ? pages[1] : pages[0];

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const color = rgb(0, 0, 0);

    // Write metadata to PDF document target
    page.drawText(customer.name ?? "", { x: 120, y: 250, size: 11, font, color });
    page.drawText(customer.date ?? "", { x: 430, y: 250, size: 11, font, color });
    page.drawText(customer.product ?? "", { x: 120, y: 228, size: 10, font, color });
    page.drawText(String(customer.price ?? ""), { x: 130, y: 210, size: 10, font, color });
    page.drawText(String(customer.downPayment ?? ""), { x: 180, y: 195, size: 10, font, color });
    page.drawText(String(customer.balance ?? ""), { x: 180, y: 178, size: 10, font, color });
    page.drawText(String(customer.emiAmount ?? ""), { x: 150, y: 145, size: 10, font, color });
    page.drawText(String(customer.numberOfEmi ?? ""), { x: 150, y: 128, size: 10, font, color });

    const pdfBytes = await pdfDoc.save();


  const blob = await put(
  `Loan_Form_${customer.name}.pdf`,
  Buffer.from(pdfBytes),
  {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/pdf",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }
);

//return Response.json({
//  success: true,
//  downloadUrl: blob.url,
//});

  //return new Response(pdfBytes, {
  //  headers: {
  //    "Content-Type": "application/pdf",
  //    "Content-Disposition": `attachment; filename="Loan_Form_${customer.name}.pdf"`,
  //  },
  //});

  return Response.json({
  success: true,
  downloadUrl: blob.url,
  pdf: Buffer.from(pdfBytes).toString("base64"),
});



  } catch (err) {
    console.error(err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}