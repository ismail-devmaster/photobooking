"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableLocales = availableLocales;
exports.t = t;
exports.clearI18nCache = clearI18nCache;
// src/config/i18n.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOCALES_DIR = path_1.default.join(process.cwd(), 'locales');
const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || 'en';
const SUPPORTED_LOCALES = ['en', 'ar'];
const cache = new Map();
function loadLocaleFile(locale) {
    if (cache.has(locale))
        return cache.get(locale);
    const file = path_1.default.join(LOCALES_DIR, `${locale}.json`);
    if (!fs_1.default.existsSync(file)) {
        if (locale !== DEFAULT_LOCALE)
            return loadLocaleFile(DEFAULT_LOCALE);
        cache.set(locale, {});
        return {};
    }
    const raw = fs_1.default.readFileSync(file, 'utf-8');
    const json = JSON.parse(raw);
    cache.set(locale, json);
    return json;
}
function availableLocales() {
    return SUPPORTED_LOCALES;
}
function t(locale, key, vars) {
    const loc = (locale && SUPPORTED_LOCALES.includes(locale)) ? locale : DEFAULT_LOCALE;
    const translations = loadLocaleFile(loc) || {};
    const parts = key.split('.');
    let cur = translations;
    for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur)
            cur = cur[p];
        else {
            cur = undefined;
            break;
        }
    }
    if (typeof cur === 'undefined') {
        // fallback to default locale if not the same
        if (loc !== DEFAULT_LOCALE)
            return t(DEFAULT_LOCALE, key, vars);
        // last resort: return key as readable fallback
        return key;
    }
    if (typeof cur === 'string') {
        if (!vars)
            return cur;
        return cur.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
            const v = vars[name];
            return typeof v !== 'undefined' ? String(v) : '';
        });
    }
    return cur;
}
function clearI18nCache() {
    cache.clear();
}
