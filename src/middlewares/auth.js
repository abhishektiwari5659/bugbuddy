import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";

dotenv.config();

export const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).send("please login");

    const data = jwt.verify(token, process.env.JWT_SECRET);

    const userDoc = await User.findById(data._id);
    if (!userDoc) return res.status(401).send("User not found");

    // expose both: mongoose doc for routes that need to save, and plain object for safe access
    req.userDoc = userDoc; // mongoose document (has .save())
    req.user = userDoc.toObject(); // plain object (safe to send to client)
    next(); 
  } catch (err) {
    return res.status(401).send("Invalid token, login again");
  }
};
