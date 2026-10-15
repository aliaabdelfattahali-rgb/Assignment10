import { Router } from "express";
import multer from "multer";
import { auth, uploadProfileImage } from "../../middlewares/auth.middleware.js";
import { validate, validateBody } from "../../middlewares/validation.middleware.js";
import * as service from "./user.service.js";
import {
  registerSchema,
  confirmEmailSchema,
  loginSchema,
  refreshTokenSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  socialLoginSchema,
} from "./user.validation.js";

export const userRouter = Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function withUpload(handler) {
  return (req, res, next) => {
    uploadProfileImage.single("image")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      if (err) return res.status(400).json({ message: err.message });
      handler(req, res, next).catch(next);
    });
  };
}

userRouter.post(
  "/register",
  withUpload(async (req, res) => {
    const body = req.body || {};
    const message = validateBody(body, registerSchema);
    if (message) return res.status(400).json({ message });

    const user = await service.registerUser({
      name: String(body.name).trim(),
      email: body.email,
      password: body.password,
      profileImage: req.file ? `uploads/${req.file.filename}` : null,
    });
    res.status(201).json({ message: "Registered. Check your email for the OTP.", user });
  })
);

userRouter.post(
  "/confirm-email",
  validate(confirmEmailSchema),
  asyncHandler(async (req, res) => {
    const user = await service.confirmEmail(req.body);
    res.json({ message: "Email verified successfully", user });
  })
);

userRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await service.loginUser(req.body);
    res.json({ message: "Login successful", ...result });
  })
);

userRouter.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const result = await service.refreshAccessToken(req.body.refreshToken);
    res.json(result);
  })
);

userRouter.post(
  "/forget-password",
  validate(forgetPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await service.requestPasswordReset(req.body);
    res.json(result);
  })
);

userRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await service.resetPassword(req.body);
    res.json(result);
  })
);

userRouter.post(
  "/social-login",
  validate(socialLoginSchema),
  asyncHandler(async (req, res) => {
    const result = await service.socialLogin(req.body);
    res.json({ message: "Social login successful", ...result });
  })
);

userRouter.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const user = await service.getProfile(req.user._id);
    res.json({ user });
  })
);

userRouter.patch(
  "/me",
  auth,
  withUpload(async (req, res) => {
    const { name } = req.body || {};
    if (name && String(name).trim().length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 characters" });
    }
    const user = await service.updateProfile(req.user._id, {
      name: name ? String(name).trim() : undefined,
      profileImage: req.file ? `uploads/${req.file.filename}` : undefined,
    });
    res.json({ message: "Profile updated", user });
  })
);
