import express from "express";
import connection from "./config/database.js";
import User from "./models/user.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from BugBuddy!");
});

app.post("/signup", async (req, res) => {
  const newUser = new User(req.body);

  try {
    await newUser.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send("User not added successfully: " + err.message);
  }
});

connection().then(() => {
  console.log("✅ Connected to MongoDB");
  app.listen(1234, () => console.log("🚀 Server running on port 1234"));
}).catch((err) => {
  console.error("❌ Not connected to MongoDB:", err.message);
});
