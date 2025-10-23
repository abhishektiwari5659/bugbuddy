import express from "express";
import connection from "./config/database.js";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { requestRouter } from "./routes/requests.js";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
connection().then(() => {
  console.log("✅ Connected to MongoDB");
  app.listen(1234, () => console.log("🚀 Server running on port 1234"));
}).catch((err) => {
  console.error("❌ Not connected to MongoDB:", err.message);
});
