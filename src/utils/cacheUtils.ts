
// Simple cache implementation for API responses

interface CacheItem {
  data: any;
  timestamp: number;
}

// Cache storage
const cache: Record<string, CacheItem> = {};

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

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
