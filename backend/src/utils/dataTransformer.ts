/**
 * Utility function to convert snake_case keys to camelCase
 * @param obj Object to transform
 * @returns Transformed object with camelCase keys
 */
export function toCamelCase(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  const newObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      newObj[newKey] = toCamelCase(obj[key]);
    }
  }
  return newObj;
}
