/**
 * localStorage wrapper with type safety and error handling
 */

/**
 * Storage keys used across the application
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  THEME: 'theme',
  VIEW_MODE: 'view_mode',
} as const;

/**
 * Get an item from localStorage
 * Returns null if the item doesn't exist or if there's an error
 */
export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage (key: ${key}):`, error);
    return null;
  }
}

/**
 * Set an item in localStorage
 * Returns true if successful, false otherwise
 */
export function setItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 * Returns true if successful, false otherwise
 */
export function removeItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 * Returns true if successful, false otherwise
 */
export function clear(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Get a JSON object from localStorage
 * Returns the parsed object or null if parsing fails
 */
export function getJSON<T>(key: string): T | null {
  try {
    const item = getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error parsing JSON from localStorage (key: ${key}):`, error);
    return null;
  }
}

/**
 * Set a JSON object in localStorage
 * Returns true if successful, false otherwise
 */
export function setJSON<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    return setItem(key, serialized);
  } catch (error) {
    console.error(`Error serializing JSON to localStorage (key: ${key}):`, error);
    return false;
  }
}

/**
 * Check if a key exists in localStorage
 */
export function hasKey(key: string): boolean {
  return getItem(key) !== null;
}

/**
 * Storage utility object
 */
export const storage = {
  get: getItem,
  set: setItem,
  remove: removeItem,
  clear,
  getJSON,
  setJSON,
  hasKey,
  keys: STORAGE_KEYS,
};

export default storage;
