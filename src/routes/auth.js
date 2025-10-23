import express from "express"
export const authRouter = express.Router();
import { validateSignUpData } from "../utils/validation.js";
import User from "../models/user.js";
import bcrypt from "bcrypt"
import { userAuth } from "../middlewares/auth.js";

authRouter.post("/signup", async (req, res) => {
 
  try {
    
    validateSignUpData(req);
    const {firstName, lastName, emailId, password} = req.body;
    const passwordHash = await bcrypt.hash(password, 10)
     const newUser = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash
     });
    await newUser.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const {emailId, password} = req.body;
    const user = await User.findOne({emailId: emailId});
    if(!user){
      throw new Error("user is not valid");
    }

    const isPasswordValid = await user.validatePassword(password);
    if(isPasswordValid){
      const token = await user.getJWT()
      res.cookie("token", token)
      res.send("login successfully")

    }else{
      throw new Error("password incorrect")
    }
  } catch (error) {
    res.status(404).send("error: " + error.message)
  }

})

authRouter.delete("/logout", userAuth, async (req, res)=>{
    res.cookie("token", null, {
        expires: new Date(Date.now())
    })
    res.send("logout successfully")
})