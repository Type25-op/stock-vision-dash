
// Simple cache implementation for API responses

interface CacheItem {
  data: any;
  timestamp: number;
}

// Cache storage
const cache: Record<string, CacheItem> = {};

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// Refresh cooldown in milliseconds (10 minutes)
export const REFRESH_COOLDOWN = 10 * 60 * 1000;

// Last refresh timestamps for each cache key
const lastRefreshes: Record<string, number> = {};

/**
 * Get item from cache
 * @param key - Unique cache key
 * @returns Cached data or null if expired/not found
 */
export function getFromCache(key: string): any | null {
  const item = cache[key];
  
  // Return null if item doesn't exist
  if (!item) return null;
  
  // Check if item is expired
  const now = Date.now();
  if (now - item.timestamp > CACHE_DURATION) {
    // Remove expired item
    delete cache[key];
    return null;
  }
  
  return item.data;
}

/**
 * Save item to cache
 * @param key - Unique cache key
 * @param data - Data to cache
 */
export function saveToCache(key: string, data: any): void {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
}

/**
 * Clear cache completely or specific key
 * @param key - Optional specific key to clear
 */
export function clearCache(key?: string): void {
  if (key) {
    delete cache[key];
  } else {
    // Clear all cache
    Object.keys(cache).forEach(k => delete cache[k]);
  }
}

/**
 * Get cache age in milliseconds
 * @param key - Cache key
 * @returns Age in milliseconds or null if not in cache
 */
export function getCacheAge(key: string): number | null {
  const item = cache[key];
  if (!item) return null;
  
  return Date.now() - item.timestamp;
}

/**
 * Check if refresh is allowed for this key
 * @param key - Cache key
 * @returns Whether refresh is allowed
 */
export function canRefresh(key: string): boolean {
  const lastRefresh = lastRefreshes[key] || 0;
  return Date.now() - lastRefresh >= REFRESH_COOLDOWN;
}

/**
 * Mark a key as refreshed
 * @param key - Cache key
 */
export function markRefreshed(key: string): void {
  lastRefreshes[key] = Date.now();
}

/**
 * Get remaining cooldown time in milliseconds
 * @param key - Cache key
 * @returns Remaining cooldown in milliseconds
 */
export function getRemainingCooldown(key: string): number {
  const lastRefresh = lastRefreshes[key] || 0;
  const elapsed = Date.now() - lastRefresh;
  return Math.max(0, REFRESH_COOLDOWN - elapsed);
}

/**
 * Format remaining cooldown time
 * @param ms - Milliseconds
 * @returns Formatted time string (e.g., "9m 30s")
 */
export function formatCooldown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}m ${seconds}s`;
}
