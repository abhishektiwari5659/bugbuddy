import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        requiredL:true
    }
},
    {timestamps: true}
)
const chatSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        {
            message: [messageSchema]
        }
        
    ]
})

export default mongoose.Model("Chat", chatSchema)