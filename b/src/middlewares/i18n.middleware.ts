// src/middlewares/i18n.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { t } from '../config/i18n';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';


const DEFAULT = process.env.DEFAULT_LOCALE || 'en';


export async function i18nMiddleware(req: Request, res: Response, next: NextFunction) {
try {
// priority: query.lang -> cookie 'locale' -> Authorization Bearer token -> Accept-Language header -> default
let locale: string | undefined = undefined;


// 1) query param
if (req.query.lang && typeof req.query.lang === 'string') {
locale = req.query.lang;
}

// 2) cookie
if (!locale && (req as any).cookies && (req as any).cookies.locale) {
locale = (req as any).cookies.locale;
}


// 3) Authorization header -> inspect token and try to load user's locale
if (!locale) {
const auth = req.headers['authorization'];
if (auth && String(auth).startsWith('Bearer ')) {
const token = String(auth).slice(7);
const payload = verifyAccessToken(token);
if (payload && payload.sub) {
try {
const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { locale: true } });
if (user?.locale) locale = user.locale;
} catch (err) {
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
if (lang) locale = lang;
}


if (!locale) locale = DEFAULT;


(req as any).locale = locale;
(req as any).t = (key: string, vars?: Record<string, any>) => t(locale, key, vars);
res.locals.locale = locale;
res.locals.t = (key: string, vars?: Record<string, any>) => t(locale, key, vars);


next();
} catch (err) {
// don't block the request due to i18n errors
console.error('i18nMiddleware error', err);
(req as any).locale = DEFAULT;
(req as any).t = (key: string, vars?: Record<string, any>) => t(DEFAULT, key, vars);
res.locals.locale = DEFAULT;
res.locals.t = (key: string, vars?: Record<string, any>) => t(DEFAULT, key, vars);
next();
}
}