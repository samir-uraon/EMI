import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return Response.json(
        { message: "Token and password are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const usersCollection = db.collection("users");


const hashedToken = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex");

const user = await usersCollection.findOne({
  resetPasswordToken: hashedToken,
  resetPasswordExpire: { $gt: new Date() },
});

    if (!user) {
      return Response.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpire: "",
        },
      }
    );

    return Response.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req,{params}) {
  try {
    const {token}  = await params;

    if (!token) {
      return Response.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const usersCollection = client
      .db(process.env.MONGODB_DB)
      .collection("users");

    const user = await usersCollection.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: new Date() },
    });
    console.log(user);
    

    if (!user) {
      return Response.json(
        { message: "Token Invalid or Expired" },
        { status: 404 }
      );
    }

    return Response.json(
      { message: "Token Verified" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}