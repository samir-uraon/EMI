import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    // Safely pull the parsed object body out
    const body = await req.json();
    const customer = body?.customer;

    if (!customer) {
      return Response.json(
        { success: false, message: "Missing customer payload data object" },
        { status: 400 }
      );
    }

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

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=EMI.pdf",
      },
    });

  } catch (error) {
    console.error("Backend PDF Error:", error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}