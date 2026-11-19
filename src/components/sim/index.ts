import P2cLoadBalancing from './P2cLoadBalancing.astro';
import HedgedRequests from './HedgedRequests.astro';
import RetryStorm from './RetryStorm.astro';
import MultipleComparison from './MultipleComparison.astro';
import RateLimiting from './RateLimiting.astro';
import BloomFilter from './BloomFilter.astro';
import ConsistentHashing from './ConsistentHashing.astro';

/** 노트 frontmatter 의 `simulation` 값 → 컴포넌트 */
export const simulations = {
  'p2c-load-balancing': P2cLoadBalancing,
  'hedged-requests': HedgedRequests,
  'retry-storm': RetryStorm,
  'multiple-comparison': MultipleComparison,
  'rate-limiting': RateLimiting,
  'bloom-filter': BloomFilter,
  'consistent-hashing': ConsistentHashing,
} as const;
