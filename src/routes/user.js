import express from "express";
import { userAuth } from "../middlewares/auth.js";
export const userRouter = express.Router();
import ConnectionRequest from "../models/connectionRequest.js";
import User from "../models/user.js";
const USER_SAFE_DATA = "firstName lastName photoUrl"
userRouter.get("/user/requests/received", userAuth, async (req, res)=>{
    try{
        const loggedInUser = req.user;
        const connectionRequest = await ConnectionRequest.find({
            toId: loggedInUser._id,
            status: "interested"
        }).populate("fromId", USER_SAFE_DATA)

        res.json({
            message: "Data fetched successfully",
            data: connectionRequest
        })
    }catch(err){
        req.statusCode(400).send("error: " + err.message)
    }
})

userRouter.get("/user/connections", userAuth, async (req, res)=>{
    try {
        const loggedInUser = req.user;
        const connectionRequest = await ConnectionRequest.find({
            $or: [
                {toId: loggedInUser._id, status: "accepted"},
                {fromId: loggedInUser._id, status: "accepted"}
            ]
        }).populate("fromId", USER_SAFE_DATA).populate("toId", USER_SAFE_DATA)

        const data = connectionRequest.map((r) => {
            if(r.fromId._id.toString() === loggedInUser._id.toString()){
                return r.toId
            }
            r.fromId
        })
            
        res.json({data})
    } catch (err) {
        req.statusCode(400).send("error: " + err.message)
    }
})


userRouter.get("/feed", userAuth, async (req, res)=>{
    try {
        const loggedInUser = req.user;
        const page = parseInt(req.query.page) || 1
        let limit = parseInt(req.query.limit) || 10
        limit = limit > 50 ? 50 : limit
        const skip = (page - 1) * limit
        const connectionRequest = await ConnectionRequest.find({
            $or:[{fromId: loggedInUser._id}, {toId: loggedInUser._id}]
        }).select("fromId toId")

        const hideUserFromFeed = new Set();
        connectionRequest.forEach((r) => {
            hideUserFromFeed.add(r.fromId.toString())
            hideUserFromFeed.add(r.toId.toString())
        })


        const users = await User.find({
            $and: [
                {_id: {$nin: Array.from(hideUserFromFeed)}},
                {_id: {$ne: loggedInUser._id}}
            ]
        }).select(USER_SAFE_DATA).skip(skip).limit(limit)

        res.send(users)
    } catch (error) {
        res.status(400).json({message: error.message})
    }
})