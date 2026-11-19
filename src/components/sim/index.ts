import P2cLoadBalancing from './P2cLoadBalancing.astro';

/** 노트 frontmatter 의 `simulation` 값 → 컴포넌트 */
export const simulations = {
  'p2c-load-balancing': P2cLoadBalancing,
} as const;
