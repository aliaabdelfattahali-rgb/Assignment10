import { otpTtlSeconds } from "./createOtp.js";
import { OTP_PURPOSES } from "../../modules/User/user.types.js";

export function buildOtpTemplate(to, otp, purpose) {
  const minutes = otpTtlSeconds() / 60;

  if (purpose === OTP_PURPOSES.CONFIRM) {
    return {
      to,
      subject: "Saraha: confirm your email",
      text: `Your email confirmation code is: ${otp}. It expires in ${minutes} minutes.`,
    };
  }

  return {
    to,
    subject: "Saraha: password reset code",
    text: `Your password reset code is: ${otp}. It expires in ${minutes} minutes.`,
  };
}
