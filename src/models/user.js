import mongoose from "mongoose";
import validator from "validator"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

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
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("invalid email address")
            }
        }
    },
    password:{
        type: String,
        required: true,
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error("not a strong password")
            }
        }
    },
    age: {
        type: Number,
        min: 18
    },
    photoUrl: {
        type: String,
        default: ""
    },
    about:{
        type: String,
        maxLength: 250
    },
    gender: {
        type: String,
        enum: {
            values: ["male", "female", "other"],
            message: `{VALUE} is not a valid gender`
        }
    },
    skills: {
        type: [String],
        maxLength: 10
    },
},
    {
        timestamps: true
    })

userSchema.methods.getJWT = async function(next){
    const user = this;
    const token = jwt.sign({_id : user._id}, "DevVerse!@#123", {expiresIn: "7d"});
    return token;
}

userSchema.methods.validatePassword = async function(passwordInput){
    const user = this;
    const passwordHash = user.password;
    const isPasswordValid = await bcrypt.compare(passwordInput, passwordHash)
    return isPasswordValid;
}
export default mongoose.models.User || mongoose.model("User", userSchema);
