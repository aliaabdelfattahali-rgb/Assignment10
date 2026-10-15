import jwt from "jsonwebtoken";
import User from "../../DB/models/user.model.js";
import { hashPassword, comparePassword } from "../../utils/security/hash.js";
import { createOtp, storeOtp, verifyOtpOnce, getRedis } from "../../utils/email/createOtp.js";
import { sendOtpEmail } from "../../utils/email/sendEmail.js";
import { OTP_PURPOSES, SOCIAL_PROVIDERS, publicUser } from "./user.types.js";

export { getRedis };

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_EXPIRES || "15m" }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRES || "7d",
  });
}

function tokensFor(user) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

export async function registerUser({ name, email, password, profileImage }) {
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    const err = new Error("Email already registered");
    err.status = 400;
    throw err;
  }

  const hashed = await hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    profileImage: profileImage || null,
    provider: "local",
  });

  const otp = createOtp();
  await storeOtp(user.email, OTP_PURPOSES.CONFIRM, otp);
  await sendOtpEmail(user.email, otp, OTP_PURPOSES.CONFIRM);

  return publicUser(user);
}

export async function confirmEmail({ email, otp }) {
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) {
    const err = new Error("Invalid OTP or email");
    err.status = 400;
    throw err;
  }

  const ok = await verifyOtpOnce(user.email, OTP_PURPOSES.CONFIRM, otp);
  if (!ok) {
    const err = new Error("Invalid or expired OTP");
    err.status = 400;
    throw err;
  }

  user.isVerified = true;
  await user.save();
  return publicUser(user);
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    "+password"
  );
  if (!user || !user.password) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  return { user: publicUser(user), ...tokensFor(user) };
}

export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error("user not found");
    return { accessToken: signAccessToken(user) };
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.status = 401;
    throw err;
  }
}

export async function requestPasswordReset({ email }) {
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return { message: "If this email is registered, a reset code was sent" };

  const otp = createOtp();
  await storeOtp(user.email, OTP_PURPOSES.RESET, otp);
  await sendOtpEmail(user.email, otp, OTP_PURPOSES.RESET);
  return { message: "If this email is registered, a reset code was sent" };
}

export async function resetPassword({ email, otp, newPassword }) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    "+password"
  );
  if (!user) {
    const err = new Error("Invalid or expired OTP");
    err.status = 400;
    throw err;
  }

  const ok = await verifyOtpOnce(user.email, OTP_PURPOSES.RESET, otp);
  if (!ok) {
    const err = new Error("Invalid or expired OTP");
    err.status = 400;
    throw err;
  }

  user.password = await hashPassword(newPassword);
  await user.save();
  return { message: "Password reset successfully" };
}

export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return publicUser(user);
}

export async function updateProfile(userId, { name, profileImage }) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (name) user.name = name;
  if (profileImage) user.profileImage = profileImage;
  await user.save();
  return publicUser(user);
}

export async function socialLogin({ email, name, provider, providerId }) {
  if (!SOCIAL_PROVIDERS.includes(provider)) {
    const err = new Error("Unsupported provider (use google or facebook)");
    err.status = 400;
    throw err;
  }

  const normalizedEmail = String(email).toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      name: name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      provider,
      providerId: providerId || null,
      isVerified: true,
    });
  } else if (user.provider === "local") {
    user.providerId = providerId || user.providerId;
    user.isVerified = true;
    await user.save();
  }

  return { user: publicUser(user), ...tokensFor(user) };
}
