"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
// src/utils/slug.ts
function slugify(input) {
    return (input || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // allow Arabic letters too
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}
