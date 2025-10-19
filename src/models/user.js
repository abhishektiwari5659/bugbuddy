import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    age: {
        type: Number,
        min: 18
    },
    photoUrl: {
        type: String,
        default: ""
    },
    gender: {
        type: String,
        validate(value){
            if(!["male", "female", "others"].includes(value)) {
                throw new Error("not a valid gender")
            }
        }
    },
    skills: {
        type: [String]
    },
},
    {
        timestamps: true
    })

export default mongoose.model("User", userSchema);