import express from "express";
export const authRouter = express.Router();
import { validateSignUpData } from "../utils/validation.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";

authRouter.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);

    const { firstName, lastName, emailId, password, photoUrl } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      photoUrl: photoUrl || undefined,
    });

    await newUser.save();

    const token = await newUser.getJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,        // IMPORTANT for production
      sameSite: "none",    // REQUIRED for cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.send(newUser);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId });
    if (!user) throw new Error("user is not valid");

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) throw new Error("password incorrect");

    const token = await user.getJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,        // REQUIRED
      sameSite: "none",    // REQUIRED
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.send(user);
  } catch (error) {
    res.status(401).send("error: " + error.message);
  }
});

authRouter.delete("/logout", async (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(Date.now()),
  });

  res.send("logout successfully");
});
