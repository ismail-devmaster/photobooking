"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIo = getIo;
exports.emitToUser = emitToUser;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
let io = null;
/**
 * Map userId -> Set(socketId)
 */
const userSockets = new Map();
function initSocket(server) {
    if (io)
        return io;
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.use((socket, next) => {
        try {
            // client should send access token in handshake auth: { token: 'Bearer ...' } or directly token
            const tokenRaw = (socket.handshake.auth && (socket.handshake.auth.token || socket.handshake.auth.accessToken)) || socket.handshake.headers['authorization'];
            if (!tokenRaw) {
                return next(new Error('Authentication error: missing token'));
            }
            // handle "Bearer <token>" header style too
            const token = String(tokenRaw).startsWith('Bearer ') ? String(tokenRaw).slice(7) : String(tokenRaw);
            const payload = (0, jwt_1.verifyAccessToken)(token);
            if (!payload || !payload.sub) {
                return next(new Error('Authentication error: invalid token'));
            }
            // attach userId to socket
            socket.userId = payload.sub;
            next();
        }
        catch (err) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.userId;
        if (!userId) {
            socket.disconnect(true);
            return;
        }
        // track socket
        const set = userSockets.get(userId) ?? new Set();
        set.add(socket.id);
        userSockets.set(userId, set);
        // join room for user
        socket.join(`user:${userId}`);
        // optionally send a connected event
        socket.emit('connected', { userId });
        socket.on('disconnect', () => {
            const s = userSockets.get(userId);
            if (s) {
                s.delete(socket.id);
                if (s.size === 0)
                    userSockets.delete(userId);
                else
                    userSockets.set(userId, s);
            }
        });
        // client can ack receipt, mark message delivered, etc.
        socket.on('ping', (payload, cb) => {
            if (cb)
                cb({ ok: true });
        });
    });
    console.log('✅ Socket.IO initialized');
    return io;
}
function getIo() {
    if (!io)
        throw new Error('Socket.IO not initialized');
    return io;
}
/**
 * Emit an event to a specific user (all connected sockets)
 */
function emitToUser(userId, event, data) {
    if (!io)
        return;
    // room method is simplest
    io.to(`user:${userId}`).emit(event, data);
}
