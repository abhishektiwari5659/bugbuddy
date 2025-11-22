import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).send("please login");

    const data = jwt.verify(token, "DevVerse!@#123");

    const user = await User.findById(data._id);
    if (!user) return res.status(401).send("User not found");

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).send("Invalid token, login again");
  }
};
