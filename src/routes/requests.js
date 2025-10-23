import express from "express"
export const requestRouter = express.Router();
import { userAuth } from "../middlewares/auth.js";
import ConnectionRequest from "../models/connectionRequest.js";
import User from "../models/user.js";

requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res)=>{
    try {
        const fromId = req.user._id;
        const toId = req.params.toUserId;
        const status = req.params.status;

        const allowedStatus = ["interested", "ignored"];
        if(!allowedStatus.includes(status)){
            res.status(400).json({
                message: "invalid status type: " + status
            })
        }

        const toUser = await User.findById(toId);
        if(!toUser){
            return res.status(400).json({message:"user doesn't exist"})
        }

        const existingConnection = await ConnectionRequest.findOne({
            $or: [
                {fromId, toId},
                {fromId: toId, toId: fromId}
            ]
        })
        if(existingConnection){
            return res.status(400).json({message: "connection already exist"})
        }
        const connectionRequest = new ConnectionRequest({
            fromId,
            toId,
            status
        })

        const data = await connectionRequest.save();
        res.json({message: "connectionRequest sent",
            data,
        })
    } catch (e) {
        res.status(400).send("error: " + e.message)
    }
})

requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const {status, requestId} = req.params;
        const allowedStatus = ["accepted", "rejected"]
        if(!allowedStatus.includes(status)){
            return res.status(400).json({message: "status not allowed"})
        }

        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toId: loggedInUser._id,
            status: "interested"
        })

        if(!connectionRequest){
            return res.status(400).send("connection request not found")

        }

        connectionRequest.status = status;
        const data = await connectionRequest.save();
        res.json({message: "connectionRequest" + status, data})
    } catch (error) {
        res.status(400).send("Error: "+ error.message)
    }

})