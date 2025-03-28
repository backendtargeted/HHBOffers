"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCamelCase = toCamelCase;
/**
 * Utility function to convert snake_case keys to camelCase
 * @param obj Object to transform
 * @returns Transformed object with camelCase keys
 */
function toCamelCase(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(toCamelCase);
    }
    const newObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
            newObj[newKey] = toCamelCase(obj[key]);
        }
    }
    return newObj;
}
