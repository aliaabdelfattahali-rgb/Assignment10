import crypto from "crypto";



function getKey() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET is missing. Check config/.env");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

const ALGORITHM = "aes-256-cbc";


export function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}


export function decrypt(payload) {
  const key = getKey();
  const [ivHex, encryptedHex] = String(payload).split(":");
  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid encrypted payload format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
