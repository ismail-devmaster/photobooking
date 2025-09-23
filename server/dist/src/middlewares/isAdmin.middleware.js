"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = isAdmin;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
/**
 * Ensure the current request is made by an ADMIN user.
 * - expects authenticateAccessToken to have set (req as any).userId and optionally userRole
 * - if userRole missing, fetch user from DB and attach
 */
async function isAdmin(req, res, next) {
    try {
        const anyReq = req;
        const userId = anyReq.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // If role already attached from token middleware, use it
        let role = anyReq.userRole;
        if (!role) {
            // fetch user role
            const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { role: true, disabled: true } });
            if (!user)
                return res.status(401).json({ error: 'Unauthorized' });
            anyReq.userRole = user.role;
            // also attach disabled for checks
            anyReq.userDisabled = user.disabled;
            role = user.role;
        }
        if (role !== client_1.Role.ADMIN) {
            return res.status(403).json({ error: 'Forbidden: admin only' });
        }
        // also ensure admin account not disabled
        if ((anyReq.userDisabled ?? false) === true) {
            return res.status(403).json({ error: 'Account disabled' });
        }
        return next();
    }
    catch (err) {
        console.error('isAdmin error', err);
        return res.status(500).json({ error: 'Server error' });
    }
}
