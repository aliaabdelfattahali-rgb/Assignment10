import nodemailer from "nodemailer";
import { buildOtpTemplate } from "./emailTemplate.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

export async function sendOtpEmail(to, otp, purpose) {
  const { subject, text } = buildOtpTemplate(to, otp, purpose);
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html: `<p>${text}</p>`,
  });
}
