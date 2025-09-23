// src/config/i18n.ts
import fs from 'fs';
import path from 'path';


const LOCALES_DIR = path.join(process.cwd(), 'locales');
const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || 'en';
const SUPPORTED_LOCALES = ['en', 'ar'];


const cache = new Map<string, any>();


function loadLocaleFile(locale: string) {
if (cache.has(locale)) return cache.get(locale);
const file = path.join(LOCALES_DIR, `${locale}.json`);
if (!fs.existsSync(file)) {
if (locale !== DEFAULT_LOCALE) return loadLocaleFile(DEFAULT_LOCALE);
cache.set(locale, {});
return {};
}
const raw = fs.readFileSync(file, 'utf-8');
const json = JSON.parse(raw);
cache.set(locale, json);
return json;
}


export function availableLocales() {
return SUPPORTED_LOCALES;
}


export function t(locale: string | undefined, key: string, vars?: Record<string, any>) {
const loc = (locale && SUPPORTED_LOCALES.includes(locale)) ? locale : DEFAULT_LOCALE;
const translations = loadLocaleFile(loc) || {};


const parts = key.split('.');
let cur: any = translations;
for (const p of parts) {
if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
else { cur = undefined; break; }
}


if (typeof cur === 'undefined') {
// fallback to default locale if not the same
if (loc !== DEFAULT_LOCALE) return t(DEFAULT_LOCALE, key, vars);
// last resort: return key as readable fallback
return key;
}


if (typeof cur === 'string') {
if (!vars) return cur;
return cur.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
const v = vars[name];
return typeof v !== 'undefined' ? String(v) : '';
});
}


return cur;
}


export function clearI18nCache() {
cache.clear();
}