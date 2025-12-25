import { createHash } from 'crypto';

/**
 * Generates a hash from an object to use as part of cache keys.
 * This ensures unique cache keys for different query parameters.
 * @param obj - Object to hash (e.g., filter options, pagination params)
 * @returns A short hash string
 */
export function generateCacheKeyHash(obj: Record<string, any> | undefined | null): string {
  if (!obj || Object.keys(obj).length === 0) {
    return 'default';
  }

  // Sort keys to ensure consistent hash regardless of object property order
  const sortedObj = Object.keys(obj)
    .sort()
    .reduce(
      (acc, key) => {
        const value = obj[key];
        // Only include defined values
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );

  if (Object.keys(sortedObj).length === 0) {
    return 'default';
  }

  const jsonString = JSON.stringify(sortedObj);
  return createHash('md5').update(jsonString).digest('hex').substring(0, 12);
}

/**
 * Builds a cache key from prefix and identifiers.
 * @param prefix - The cache key prefix (e.g., 'provinces:list')
 * @param identifiers - Additional identifiers to append
 * @returns The complete cache key
 */
export function buildCacheKey(prefix: string, ...identifiers: (string | number)[]): string {
  const parts = [prefix, ...identifiers.map(String)];
  return parts.join(':');
}

/**
 * Builds a cache key for list queries with optional filters and pagination.
 * @param prefix - The cache key prefix
 * @param options - Query options including pagination, filters, and sort
 * @returns The complete cache key
 */
export function buildListCacheKey(
  prefix: string,
  options?: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, any>;
    sort?: Record<string, any>[] | Record<string, any>;
  },
): string {
  const hash = generateCacheKeyHash({
    page: options?.page,
    pageSize: options?.pageSize,
    filters: options?.filters,
    sort: options?.sort,
  });

  return buildCacheKey(prefix, hash);
}
