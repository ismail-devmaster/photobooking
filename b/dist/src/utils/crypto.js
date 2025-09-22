"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomToken = randomToken;
exports.sha256hex = sha256hex;
// src/utils/crypto.ts
const crypto_1 = __importDefault(require("crypto"));
function randomToken(size = 48) {
    // returns base64url-safe token
    return crypto_1.default.randomBytes(size).toString('base64url');
}
function sha256hex(value) {
    return crypto_1.default.createHash('sha256').update(value).digest('hex');
}
