import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const collections = await db.listCollections().toArray();

    return Response.json(
      collections.map((c) => c.name)
    );
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}