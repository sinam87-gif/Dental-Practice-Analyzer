/** Free-plan application limits; these do not replace account-wide usage monitoring. */
export const MAX_STEPS_PER_DAY=1100,MAX_JOB_STEPS_PER_DAY=1000;
// Search-specific headroom; other app/account traffic shares the actual Cloudflare quota.
export const MAX_SEARCH_ROWS_READ=500000,MAX_SEARCH_ROWS_WRITTEN=30000;
export const CACHE_TTL=7*86400000,ADVANCE_INTERVAL=15000;
export class SearchRateLimit extends Error{constructor(message:string,public retryAfter=60){super(message);}}
