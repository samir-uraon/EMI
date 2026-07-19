import clientPromise from "@/lib/mongodb";
import sheets from "@/lib/googleSheets";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Get all collections automatically
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      const sheetName = collection.name;

      const documents = await db.collection(sheetName).find({}).toArray();

      if (documents.length === 0) continue;

      // Get headers
      const headers = Object.keys(documents[0]);

      // Convert MongoDB documents to sheet rows
      const rows = documents.map((doc) =>
        headers.map((key) => {
          let value = doc[key];

          if (value === null || value === undefined) return "";

          // ObjectId
          if (value instanceof ObjectId) {
            return value.toString();
          }

          // Date
          if (value instanceof Date) {
            return value.toISOString();
          }

          // Array
          if (Array.isArray(value)) {
            const text = JSON.stringify(value);
            return text.length > 49000
              ? `[Array (${value.length} items)]`
              : text;
          }

          // Object
          if (typeof value === "object") {
            const text = JSON.stringify(value);
            return text.length > 49000
              ? "[Large Object]"
              : text;
          }

          // String
          if (typeof value === "string") {
            return value.length > 49000
              ? value.substring(0, 49000)
              : value;
          }

          return String(value);
        })
      );

      // Clear old data
      await sheets.spreadsheets.values.clear({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `${sheetName}!A:ZZ`,
      });

      // Write new data
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [headers, ...rows],
        },
      });
    }

    return Response.json({
      success: true,
      message: "All collections exported successfully",
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}