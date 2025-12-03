import express from "express";
import connection from "./config/database.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { requestRouter } from "./routes/requests.js";
import { userRouter } from "./routes/user.js";
import aiRoutes from "./routes/aiRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import initializeSocket from "./utils/socket.js";
import chatRouter from "./routes/chat.js";

dotenv.config();
const app = express();

const server = http.createServer(app);
initializeSocket(server);

// -----------------------------------
// FIXED CORS (Supports Local + Prod)
// -----------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://dev-verse-mu.vercel.app", 
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
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
app.use("/", paymentRouter);
app.use("/", chatRouter);

// Start Server
connection()
  .then(() => {
    console.log("✅ Connected to MongoDB");
    server.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Not connected to MongoDB:", err.message);
  });
