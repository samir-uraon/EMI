import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const data = await req.json();

    // PDF Template Path
    const pdfPath = path.join(
      process.cwd(),
      "public",
      "templates",
      "form.pdf"
    );

    console.log("PDF Path:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF not found: ${pdfPath}`);
    }

    // Read PDF
    const existingPdfBytes = fs.readFileSync(pdfPath);

    // Load PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get Pages
    const pages = pdfDoc.getPages();

    console.log("Total Pages:", pages.length);

    // Use second page if available otherwise first
    const page = pages.length > 1 ? pages[1] : pages[0];

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const color = rgb(0, 0, 0);

    // -----------------------
    // Customer Details (Starting from y = 250)
    // -----------------------

    // Name (নাম)
    page.drawText(data.name ?? "", {
      x: 120,
      y: 250, // আপনার চাহিদা অনুযায়ী প্রথম টেক্সট শুরু
      size: 11,
      font,
      color,
    });

    // Date (তারিখ) - একই লাইনে বা একটু উপরে ডানে রাখতে পারেন
    page.drawText(data.date ?? "", {
      x: 430,
      y: 250, 
      size: 11,
      font,
      color,
    });

    // দ্রব্যের বিবরণ
    page.drawText(data.product ?? "", {
      x: 120,
      y: 228, // ২৫ ইউনিট নিচে
      size: 10,
      font,
      color,
    });

    // Price (মূল্য)
    page.drawText(String(data.price ?? ""), {
      x: 130,
      y: 210, // ২৫ ইউনিট নিচে
      size: 10,
      font,
      color,
    });

    // Down Payment
    page.drawText(String(data.downPayment ?? ""), {
      x: 180,
      y: 195,
      size: 10,
      font,
      color,
    });

		

    // Balance Amount
    page.drawText(String(data.balance ?? ""), {
      x: 180,
      y: 178,
      size: 10,
      font,
      color,
    });


						// EMI Amount
    page.drawText(String(data.emiAmount ?? ""), {
      x: 150,
      y: 145,
      size: 10,
      font,
      color,
    });
				// MONTH
    page.drawText(String(data.numberOfEmi ?? ""), {
      x: 150,
      y: 128,
      size: 10,
      font,
      color,
    });



   

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="EMI_Form.pdf"',
      },
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}