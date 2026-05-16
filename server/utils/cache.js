/**
 * utils/cache.js
 * In-process cache wrapper using node-cache.
 * Zero-infra alternative to Redis for hot GET endpoints.
 *
 * Usage:
 *   import { getOrSet, invalidate, invalidatePrefix } from "../utils/cache.js";
 *
 *   // Read-through:
 *   const data = await getOrSet("club:123", 60, () => Club.findById("123").lean());
 *
 *   // Invalidate on write:
 *   invalidate("club:123");
 */

import NodeCache from "node-cache";
import logger from "../middleware/logger.js";

// stdTTL=0 means no default TTL — callers specify it per key
const cache = new NodeCache({ stdTTL: 0, checkperiod: 120, useClones: false });

/**
 * Cache-aside: returns cached value if present, otherwise calls fetchFn,
 * stores the result, and returns it.
 *
 * @param {string} key       Cache key
 * @param {number} ttl       TTL in seconds
 * @param {Function} fetchFn Async function returning fresh data
 */
export const getOrSet = async (key, ttl, fetchFn) => {
  const cached = cache.get(key);
  if (cached !== undefined) {
    logger.debug(`[CACHE HIT]  ${key}`);
    return cached;
  }
  logger.debug(`[CACHE MISS] ${key}`);
  const value = await fetchFn();
  if (value !== undefined && value !== null) {
    cache.set(key, value, ttl);
  }
  return value;
};

/**
 * Invalidate a single cache key.
 */
export const invalidate = (key) => {
  cache.del(key);
  logger.debug(`[CACHE DEL]  ${key}`);
};

/**
 * Invalidate all keys that start with `prefix`.
 */
export const invalidatePrefix = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) {
    cache.del(keys);
    logger.debug(`[CACHE DEL PREFIX] ${prefix}* (${keys.length} keys)`);
  }
};

export default cache;
