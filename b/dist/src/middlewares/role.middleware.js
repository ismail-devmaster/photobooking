"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
// keep behavior: expects authenticateAccessToken to have set req.userRole
function requireRole(...allowed) {
    return (req, res, next) => {
        const role = req.userRole;
        if (!role)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!allowed.includes(role))
            return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}
