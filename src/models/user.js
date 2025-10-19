import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName:{
        type: String
    },
    emailId:{
        type: String
    },
    age:{
        type:Number
    },
    gender:{
        type: String
    }
})

export default mongoose.model("User", userSchema);