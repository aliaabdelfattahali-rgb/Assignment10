import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    providerId: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
