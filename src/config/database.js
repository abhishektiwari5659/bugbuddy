import mongoose from "mongoose";

const connection = async () =>{
    await mongoose.connect("mongodb+srv://usingforailogin:zZaHcJrWdi3uR6uW@database.b7mwlo9.mongodb.net/bugbuddy")
}

export default connection;