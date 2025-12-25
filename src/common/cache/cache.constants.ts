/**
 * Cache TTL values in milliseconds
 */
export const CACHE_TTL = {
  /** 1 hour - for rarely changing data like provinces */
  PROVINCES_LIST: 60 * 60 * 1000,
  /** 1 hour */
  PROVINCE_DETAIL: 60 * 60 * 1000,
  /** 15 minutes */
  BRANCHES_LIST: 15 * 60 * 1000,
  /** 5 minutes - frequently accessed, changes with new branches */
  BRANCHES_LATEST: 5 * 60 * 1000,
  /** 15 minutes */
  BRANCHES_INFINITE: 15 * 60 * 1000,
  /** 10 minutes */
  BRANCH_DETAIL: 10 * 60 * 1000,
  /** Default TTL: 5 minutes */
  DEFAULT: 5 * 60 * 1000,
} as const;

/**
 * Cache key prefixes for different entities
 */
export const CACHE_KEYS = {
  /** Provinces cache keys */
  PROVINCES: {
    LIST: 'provinces:list',
    DETAIL: 'provinces:detail',
    ALL: 'provinces:*',
  },
  /** Branches cache keys */
  BRANCHES: {
    LIST: 'branches:list',
    LATEST: 'branches:latest',
    INFINITE: 'branches:infinite',
    DETAIL: 'branches:detail',
    ALL: 'branches:*',
  },
} as const;

/**
 * Cache namespace for the application
 */
export const CACHE_NAMESPACE = 'hotel-server';
