import { NextResponse } from "next/server";
import { createExcel } from "@/lib/exportExcel";
import { getAllCollections } from "@/lib/getAllCollections";
import { uploadFile } from "@/lib/googleDrive";

export async function GET() {
  try {
    // Read all MongoDB collections
    const collections = await getAllCollections();

    // Create workbook
    const workbook = await createExcel(collections);

    // Convert workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // File name
    const date = new Date().toISOString().split("T")[0];

    const fileName = `Backup-${date}.xlsx`;

    // Upload to Google Drive
    const file = await uploadFile(buffer, fileName);

    return NextResponse.json({
      success: true,
      file,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}