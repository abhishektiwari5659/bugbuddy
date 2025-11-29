import { Server } from "socket.io";
import crypto from "crypto";
import Chat from "../models/chat.js";

const roomidHash = (userId, target) => {
	return crypto
		.createHash("sha256")
		.update([userId, target].sort().join("_"))
		.digest("hex");
};

let onlineUsers = {};
let lastSeenMap = {};

const initializeSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: "http://localhost:5173",
		},
	});

	io.on("connection", (socket) => {
		console.log("⚡ Socket Connected:", socket.id);
        
		socket.on("joinChat", ({ firstName, userId, target }) => {
			const roomId = roomidHash(userId, target);

			console.log(firstName + " joined room:", roomId);
			socket.join(roomId);
            
			const wasOnline = onlineUsers.hasOwnProperty(userId);
			onlineUsers[userId] = socket.id;
            socket.userId = userId; // CRITICAL: Store ID on the socket instance

			if (!wasOnline) {
				io.emit("userOnline", userId);
			}
		});
        
		socket.on("requestStatus", ({ userId: requestedId }) => {
			const isTargetOnline = onlineUsers.hasOwnProperty(requestedId);
			const lastSeen = lastSeenMap[requestedId] || null;

			socket.emit("initialStatus", {
				isOnline: isTargetOnline,
				lastSeen: isTargetOnline ? null : lastSeen,
			});
		});

        /* ---------------------------------------------------------
    TYPING INDICATORS
--------------------------------------------------------- */
socket.on("typing", ({ target, senderName }) => {
    if (!socket.userId) return;

    const roomId = roomidHash(socket.userId, target);

    socket.to(roomId).emit("targetTyping", {
        senderName: senderName || "User"
    });
});

socket.on("stopTyping", ({ target }) => {
    if (!socket.userId) return;

    const roomId = roomidHash(socket.userId, target);

    socket.to(roomId).emit("targetStopTyping");
});



		socket.on("sendMessage", async ({ firstName, userId, target, text }) => {
			try {
				const roomId = roomidHash(userId, target);

				let chat = await Chat.findOne({
					participants: { $all: [userId, target] },
				});

				if (!chat) {
					chat = await new Chat({
						participants: [userId, target],
						message: [],
					});
				}

				chat.message.push({
					senderId: userId,
					text,
					seen: false,
				});

				await chat.save();

				io.to(roomId).emit("messageReceived", { firstName, text });
			} catch (error) {
				console.log(error);
			}
		});

        /* ---------------------------------------------------------
            MARK AS SEEN / SEEN RECEIPT
        --------------------------------------------------------- */
        socket.on("markAsSeen", async ({ senderId: viewerId, targetId: messageSenderId }) => {
            try {
                const chat = await Chat.findOne({
                    participants: { $all: [viewerId, messageSenderId] },
                });

                if (chat) {
                    const updateResult = await Chat.updateOne(
                        { 
                            _id: chat._id, 
                            "message.senderId": messageSenderId 
                        },
                        { $set: { "message.$[elem].seen": true } },
                        { 
                            arrayFilters: [{ "elem.senderId": messageSenderId, "elem.seen": { $ne: true } }] 
                        }
                    );
                    
                    if (updateResult.modifiedCount > 0) {
                        const senderSocketId = onlineUsers[messageSenderId];
                        if (senderSocketId) {
                            io.to(senderSocketId).emit("seenReceipt");
                        }
                    }
                }
            } catch (error) {
                console.error("Error marking messages as seen:", error);
            }
        });


		socket.on("disconnect", () => {
			console.log("❌ Socket Disconnected:", socket.id);

			const disconnectedUser = socket.userId;

			if (disconnectedUser && onlineUsers[disconnectedUser] === socket.id) {
				delete onlineUsers[disconnectedUser];
                
				const lastSeen = new Date().toISOString();
				lastSeenMap[disconnectedUser] = lastSeen;

				io.emit("userOffline", {
					userId: disconnectedUser,
					lastSeen,
				});

				console.log("User Offline:", disconnectedUser, lastSeen);
			}
		});
	});
};

export default initializeSocket;