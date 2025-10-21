import jwt from "jsonwebtoken"
import User from "../models/user.js";

export const userAuth = async (req, res, next) => {
    const {token} = req.cookies;
    if(!token){
        throw new Error("please login");
    }

    const data = jwt.verify(token, "DevVerse!@#123");
    const {_id} = data;
    const user = await User.findById(_id);
    if(!user){
        throw new Error("USer not found")
    }

    req.user = user;
    next()
}