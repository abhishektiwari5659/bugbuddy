import express from "express";
import connection from "./config/database.js";
import User from "./models/user.js";
import { validateSignUpData } from "./utils/validation.js";
import bycrypt from "bcrypt"
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import { userAuth } from "./middlewares/auth.js";
const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello from BugBuddy!");
});

app.post("/signup", async (req, res) => {
 
  try {
    
    validateSignUpData(req);
    const {firstName, lastName, emailId, password} = req.body;
    const passwordHash = await bycrypt.hash(password, 10)
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

app.post("/login", async (req, res) => {
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


app.get("/profile", userAuth, async (req, res)=>{
  const user = req.user;
  if(!user){
    throw new Error("User doesn't exist")
  }

  res.send(user)  
})

app.patch("/user", async (req, res) => {
  const userId = req.body.userId;
  const data = req.body;
  try {
    const user = await User.findByIdAndUpdate({_id: userId}, data, {
      returnDocument: "after",
      runValidators: true,
    });
    console.log(user);
    res.send("user updated .")
  } catch (error) {
    res.status(400).send("update failed :" + error.message)
    
  }
})
connection().then(() => {
  console.log("✅ Connected to MongoDB");
  app.listen(1234, () => console.log("🚀 Server running on port 1234"));
}).catch((err) => {
  console.error("❌ Not connected to MongoDB:", err.message);
});
