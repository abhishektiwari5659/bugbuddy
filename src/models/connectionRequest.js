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
        required: true,
        enum: {
            values: ["ignored", "accepted", "rejected", "interested"],
            message: `{VALUE} is not a valid status`
        }
    }
},
{
    timestamps:true
})

connectionSchema.index({fromId: 1, toId: 1})

connectionSchema.pre("save", function(next){
    const connectionRequest = this;
    if(connectionRequest.fromId.equals(connectionRequest.toId)){
        throw new Error("sending request to same id")
    }
    next()
})

export default new mongoose.model("ConnectionRequest", connectionSchema);