"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nMiddleware = i18nMiddleware;
const i18n_1 = require("../config/i18n");
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../config/prisma");
const DEFAULT = process.env.DEFAULT_LOCALE || 'en';
async function i18nMiddleware(req, res, next) {
    try {
        // priority: query.lang -> cookie 'locale' -> Authorization Bearer token -> Accept-Language header -> default
        let locale = undefined;
        // 1) query param
        if (req.query.lang && typeof req.query.lang === 'string') {
            locale = req.query.lang;
        }
        // 2) cookie
        if (!locale && req.cookies && req.cookies.locale) {
            locale = req.cookies.locale;
        }
        // 3) Authorization header -> inspect token and try to load user's locale
        if (!locale) {
            const auth = req.headers['authorization'];
            if (auth && String(auth).startsWith('Bearer ')) {
                const token = String(auth).slice(7);
                const payload = (0, jwt_1.verifyAccessToken)(token);
                if (payload && payload.sub) {
                    try {
                        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub }, select: { locale: true } });
                        if (user?.locale)
                            locale = user.locale;
                    }
                    catch (err) {
                        // ignore DB errors here — fall back
                        console.warn('i18n middleware could not fetch user locale', err);
                    }
                }
            }
        }
        // 4) Accept-Language header
        if (!locale && req.headers['accept-language']) {
            const raw = String(req.headers['accept-language']);
            const lang = raw.split(',')[0].split('-')[0];
            if (lang)
                locale = lang;
        }
        if (!locale)
            locale = DEFAULT;
        req.locale = locale;
        req.t = (key, vars) => (0, i18n_1.t)(locale, key, vars);
        res.locals.locale = locale;
        res.locals.t = (key, vars) => (0, i18n_1.t)(locale, key, vars);
        next();
    }
    catch (err) {
        // don't block the request due to i18n errors
        console.error('i18nMiddleware error', err);
        req.locale = DEFAULT;
        req.t = (key, vars) => (0, i18n_1.t)(DEFAULT, key, vars);
        res.locals.locale = DEFAULT;
        res.locals.t = (key, vars) => (0, i18n_1.t)(DEFAULT, key, vars);
        next();
    }
}
