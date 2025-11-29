import express from "express"
import { userAuth } from "../middlewares/auth.js"
import Chat from "../models/chat.js"

const chatRouter = express.Router()

chatRouter.get("/chat/:target", userAuth, async (req, res) => {
    const {target} = req.params
    const userId = req.user._id
    try {
        let chat = await Chat.findOne({
            participants: {$all: [userId, target]}
        }).populate({path: "message.senderId", select: "firstName lastName"})
        if(!chat) {
            chat = new Chat({
                participants: [userId, target],
            message: []
            })
            await chat.save()
        }
        res.json(chat)
    } catch (error) {
        console.log(error)
    }
})

export default chatRouter