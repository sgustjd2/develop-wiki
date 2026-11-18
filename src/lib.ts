/** base 경로(/develop-wiki/)를 붙인 내부 링크 */
export const href = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
export const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, '');
