import express from "express"
export const profileRouter = express.Router();
import { userAuth } from "../middlewares/auth.js";
import { validateProfileData } from "../utils/validation.js";

profileRouter.get("/profile/view", userAuth, async (req, res)=>{
  const user = req.user;
  if(!user){
    throw new Error("User doesn't exist")
  }

  res.send(user)  
})

profileRouter.patch("/profile/edit", userAuth, async (req, res)=> {
    try{
        if(!validateProfileData(req)){
            throw new Error("invalid edit request")
        }
        const loggedInUser = req.user;
        Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
        console.log(loggedInUser);
        await loggedInUser.save();
        res.send("updated successfully")
    }catch(err){
        res.status(400).send("error: " + err.message)
    }
})