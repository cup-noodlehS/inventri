// Safe parseInt helper to prevent NaN issues
export const safeParseInt = (value: string | null | undefined, defaultValue: number = 0): number => {
  if (!value || value.trim() === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// HTML escaping helper to prevent XSS
export const escapeHtml = (text: string): string => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Determine padding based on unit number (3 digits for < 1000, 4 digits for >= 1000)
export const getUnitPadding = (unitNum: number): number => {
  return unitNum >= 1000 ? 4 : 3;
};

// Escape JavaScript string for use in HTML script tags
export const escapeJsString = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\//g, '\\/');
};

