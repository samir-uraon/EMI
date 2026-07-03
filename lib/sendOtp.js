import nodemailer from "nodemailer";

export async function sendEmail(email,msg,sub="") {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Goldy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: sub || "Verify your email",
    html: msg,
  });
} 