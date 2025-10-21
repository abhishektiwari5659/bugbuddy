import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema({
    fromId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    toId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status:{
        type: String,
        enum: {
            values: ["ignored", "accepted", "rejected", "intrested"],
            message: `{VALUE} is not a valid status`
        }
    }
},
{
    timestamps:true
})

export default new mongoose.model("ConnectionRequest", connectionSchema);