import express from "express";
export const requestRouter = express.Router();
import { userAuth } from "../middlewares/auth.js";
import ConnectionRequest from "../models/connectionRequest.js";
import User from "../models/user.js";

/*
-----------------------------------------------------
   SEND REQUEST  (interested / ignored)
-----------------------------------------------------
*/
requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const fromId = req.user._id;
    const toId = req.params.toUserId;
    const status = req.params.status;

    const allowedStatus = ["interested", "ignored"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status type: " + status,
      });
    }

    // Check if receiver exists
    const toUser = await User.findById(toId);
    if (!toUser) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // Step 1: check if THIS user already sent request to same target
    const existingRequest = await ConnectionRequest.findOne({
      fromId,
      toId,
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already sent a request",
      });
    }

    // Step 2: check if opposite user already sent "interested"
    const oppositeRequest = await ConnectionRequest.findOne({
      fromId: toId,
      toId: fromId,
      status: "interested",
    });

    // MUTUAL MATCH FOUND
    if (oppositeRequest && status === "interested") {
      await ConnectionRequest.updateMany(
        {
          $or: [
            { fromId, toId },
            { fromId: toId, toId: fromId },
          ],
        },
        { status: "accepted" }
      );

      return res.json({
        message: "Match created!",
        match: true,
      });
    }

    // Step 3: create normal 1-way request
    const connectionRequest = new ConnectionRequest({
      fromId,
      toId,
      status,
    });

    const data = await connectionRequest.save();

    res.json({
      message: "Request sent successfully",
      data,
    });

  } catch (e) {
    res.status(400).json({ message: "Error: " + e.message });
  }
});

/*
-----------------------------------------------------
    REVIEW REQUEST (accept / reject)
-----------------------------------------------------
*/
requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { status, requestId } = req.params;

    const allowedStatus = ["accepted", "rejected"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    // Only allow reviewing requests sent *to* this user
    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toId: loggedInUser._id,
      status: "interested",
    });

    if (!connectionRequest) {
      return res.status(400).json({
        message: "Request not found or already reviewed",
      });
    }

    connectionRequest.status = status;
    const data = await connectionRequest.save();

    res.json({
      message: `Request ${status}`,
      data,
    });

  } catch (error) {
    res.status(400).json({ message: "Error: " + error.message });
  }
});
