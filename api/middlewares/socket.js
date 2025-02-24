const { Server } = require('socket.io');

let io;
const connectedClients = {}; // Store active clients { instanceId: socketId }

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("registerInstance", (instanceId) => {
            if (instanceId) {
                connectedClients[instanceId] = socket.id;
                console.log(`Instance ${instanceId} registered with socket ${socket.id}`);
            }
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
            for (const instanceId in connectedClients) {
                if (connectedClients[instanceId] === socket.id) {
                    delete connectedClients[instanceId];
                    console.log(`Instance ${instanceId} disconnected`);
                    break;
                }
            }
        });
    });

    return io;
};

const emitToInstance = (instanceId, eventName, data) => {
    console.log('eventName : '+ eventName);
    if (connectedClients[instanceId]) {
        io.to(connectedClients[instanceId]).emit(eventName, data);
    } else {
        console.log(`Instance ${instanceId} is not online.`);
    }
};

const getSocketInstance = () => io;

module.exports = { initializeSocket, getSocketInstance, emitToInstance};
