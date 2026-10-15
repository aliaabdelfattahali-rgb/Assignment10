import path from "path";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./src/DB/DB.connection.js";
import { bootstrap } from "./src/bootstrap.js";
import { getRedis } from "./src/modules/User/user.service.js";

dotenv.config({ path: path.join(process.cwd(), "config", ".env") });

const PORT = process.env.PORT || 3000;

const app = express();
bootstrap(app);

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    await getRedis();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
