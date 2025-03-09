const { Server } = require('socket.io');
const mongoose = require('mongoose');
const crypto = require('crypto');

const socketSessionSchema = new mongoose.Schema({
    instanceId: String,
    socketId: String,
    token: String,
    lastActive: { type: Date, default: Date.now }
  });
const SocketSession = mongoose.model("SocketSession", socketSessionSchema);

  
let io;
const connectedClients = {}; // Store active clients { instanceId: socketId }

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
        path: "/wp/socket.io/",
        secure: true
    });

    io.on("connection", async (socket) => {
        console.log("A user connected:", socket.id);
        let { token } = socket.handshake.auth || {};
        let session = null;

        if (token) {
            // Find existing session
            session = await SocketSession.findOne({ token });
            if (session) {
              session.socketId = socket.id;
              session.lastActive = new Date();
              await session.save();
              console.log(`Restored session for instance ${session.instanceId}`);
            }
          }

          socket.on("registerInstance", async ({ instanceId }) => {
            if (!session) {
              // Create new session if no existing one
              console.log('user connected')
              token = crypto.randomBytes(16).toString("hex");
              session = new SocketSession({ instanceId, socketId: socket.id, token });
              await session.save();
            }
      
            socket.emit("sessionToken", token); // Send token to client
            console.log(`Instance ${instanceId} registered with token ${token}`);
          });

          socket.on("disconnect", async () => {
            console.log(`User disconnected: ${socket.id}`);
            if (session) {
              session.lastActive = new Date();
              await session.save();
            }
          });
      
          socket.on("reconnect_attempt", (attempt) => {
            console.log(`Client attempting to reconnect with server (Attempt: ${attempt})`);
          });
      
          socket.on("reconnect_failed", () => {
            console.error("Client failed to reconnect.");
          });
    });

    return io;
};

const emitToInstance = async (instanceId, eventName, data) => {
    const session = await SocketSession.findOne({ instanceId });
    if (session) {
        console.log(session.socketId);
        console.log(eventName, data);
        io.to(session.socketId).emit(eventName, data);
    } else {
        console.log(`Instance ${instanceId} is not online.`);
    }
};

const getSocketInstance = () => io;

module.exports = { initializeSocket, getSocketInstance, emitToInstance};
