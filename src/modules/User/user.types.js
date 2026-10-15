export const OTP_PURPOSES = {
  CONFIRM: "confirm",
  RESET: "reset",
};

export const SOCIAL_PROVIDERS = ["google", "facebook"];

export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    provider: user.provider,
    profileImage: user.profileImage,
    createdAt: user.createdAt,
  };
}
