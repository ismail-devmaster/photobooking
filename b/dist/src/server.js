"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUser = emitToUser;
// src/server.ts
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const oauth_routes_1 = __importDefault(require("./routes/oauth.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const package_routes_1 = __importDefault(require("./routes/package.routes"));
const gallery_routes_1 = __importDefault(require("./routes/gallery.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const favorite_routes_1 = __importDefault(require("./routes/favorite.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const admin_review_routes_1 = __importDefault(require("./routes/admin.review.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const contract_routes_1 = __importDefault(require("./routes/contract.routes"));
const admin_users_routes_1 = __importDefault(require("./routes/admin.users.routes"));
const admin_catalog_routes_1 = __importDefault(require("./routes/admin.catalog.routes"));
const admin_stats_routes_1 = __importDefault(require("./routes/admin.stats.routes"));
const calendar_routes_1 = __importDefault(require("./routes/calendar.routes"));
require("./config/passport"); // initialize passport strategies
const passport_1 = __importDefault(require("passport"));
// --- App setup ---
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
// --- Routes ---
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/auth/oauth', oauth_routes_1.default);
app.use('/api/v1', profile_routes_1.default);
app.use('/api/v1/packages', package_routes_1.default);
app.use('/api/v1/gallery', gallery_routes_1.default);
app.use('/api/v1/bookings', booking_routes_1.default);
app.use('/api/v1/favorites', favorite_routes_1.default);
app.use('/api/v1/reviews', review_routes_1.default);
app.use('/api/v1/admin/reviews', admin_review_routes_1.default);
app.use('/api/v1/conversations', conversation_routes_1.default);
app.use('/api/v1/messages', message_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
app.use('/api/v1/contracts', contract_routes_1.default);
app.use('/api/v1/admin', admin_users_routes_1.default);
app.use('/api/v1/admin', admin_catalog_routes_1.default);
app.use('/api/v1/admin', admin_stats_routes_1.default);
app.use('/api/v1/calendar', calendar_routes_1.default);
// --- Global error handler ---
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});
// --- HTTP + Socket.IO setup ---
const port = Number(process.env.PORT || 4000);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' }, // تقدر تخصص الدومين المسموح
});
// --- User socket mapping ---
const userSockets = new Map();
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    // المصادقة البسيطة عبر userId (يمكن تطويرها لاحقاً باستخدام JWT)
    socket.on('register', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered on socket ${socket.id}`);
    });
    socket.on('disconnect', () => {
        for (const [uid, sid] of userSockets.entries()) {
            if (sid === socket.id) {
                userSockets.delete(uid);
                console.log(`User ${uid} disconnected`);
                break;
            }
        }
    });
});
// --- Emitter function to use in services ---
function emitToUser(userId, event, payload) {
    const socketId = userSockets.get(userId);
    if (socketId) {
        io.to(socketId).emit(event, payload);
    }
}
// --- Start server ---
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
