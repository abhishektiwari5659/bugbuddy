import { Server } from "socket.io";
import crypto from "crypto"

const roomidHash = (userId, target) => {
    return crypto
    .createHash("sha256")
    .update([userId, target].sort().join("_"))
    .digest("hex")
}

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
        }
    });

    io.on("connection", (socket) => {
        //handle event
        socket.on("joinChat", ({firstName, userId, target}) => {
            const roomId = roomidHash(userId, target)
            console.log(firstName + " " + "joined the room")
            console.log(roomId)
            socket.join(roomId)
        })
        socket.on("sendMessage", ({firstName, userId, target, text}) => {
            const roomId = roomidHash(userId, target)
            io.to(roomId).emit("messageReceived", {firstName, text})
        })
        socket.on("disconnet", () => {})
    });
};

export default initializeSocket;
