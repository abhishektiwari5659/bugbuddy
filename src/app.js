import express from "express";
import connection from "./config/database.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { requestRouter } from "./routes/requests.js";
import {userRouter} from "./routes/user.js"

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
app.use(express.json());
app.use(cookieParser());
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
connection().then(() => {
  console.log("✅ Connected to MongoDB");
  app.listen(1234, () => console.log("🚀 Server running on port 1234"));
}).catch((err) => {
  console.error("❌ Not connected to MongoDB:", err.message);
});
