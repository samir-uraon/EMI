import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import { sendEmail } from "@/lib/sendOtp";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Email does not exist" },
        { status: 404 }
      );
    }
    const resetToken = crypto.randomBytes(32).toString("hex");



const hashedToken = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

await db.collection("users").updateOne(
  { email },
  {
    $set: {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: new Date(Date.now() + 60 * 60 * 1000),
    },
  }
);
		
  const resetURL = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password/${resetToken}`;

      const html = `
      <div style="font-family:Arial;padding:20px">
        <h2>Password Reset</h2>

        <p>Hello ${user.name},</p>

        <p>You requested to reset your password.</p>

        <a
          href="${resetURL}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#10b981;
            color:white;
            text-decoration:none;
            border-radius:8px;
          "
        >
          Reset Password
        </a>

        <p style="margin-top:20px">
          This link expires in 1 hour.
        </p>

        <p>If you didn't request this, simply ignore this email.</p>
      </div>
      `;

      await sendEmail(
        user.email,
        html,
        "Reset your password"
      );

    return NextResponse.json(
      { message: "Reset link sent successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}