import express from "express";
import connection from "./config/database.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv"
import http from "http"

import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { requestRouter } from "./routes/requests.js";
import { userRouter } from "./routes/user.js";
import aiRoutes from "./routes/aiRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import initializeSocket from "./utils/socket.js";

dotenv.config()
const app = express();

const server = http.createServer(app)
initializeSocket(server)
// -------------h-------------
// FIXED CORS (IMPORTANT)
// --------------------------
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/ai", aiRoutes);
app.use("/", paymentRouter)


// Start Server
connection()
  .then(() => {
    console.log("✅ Connected to MongoDB");
    server.listen(process.env.PORT, () => console.log("🚀 Server running on port 1234"));
  })
  .catch((err) => {
    console.error("❌ Not connected to MongoDB:", err.message);
  });
