"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/oauth.routes.ts
const express_1 = require("express");
const oauth_controller_1 = require("../controllers/oauth.controller");
const router = (0, express_1.Router)();
// Google
router.get('/google', oauth_controller_1.googleAuth);
router.get('/google/callback', oauth_controller_1.googleCallback);
// Facebook
router.get('/facebook', oauth_controller_1.facebookAuth);
router.get('/facebook/callback', oauth_controller_1.facebookCallback);
// Mock (POST) for dev/testing
router.post('/mock', oauth_controller_1.oauthMock);
exports.default = router;
