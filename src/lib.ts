/** base 경로(/develop-wiki/)를 붙인 내부 링크 */
export const href = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
export const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, '');

/** 콘텐츠 원본(md)을 GitHub 에서 보는 링크 */
export const REPO = 'https://github.com/sgustjd2/develop-wiki';
export const sourceUrl = (collection: string, id: string) => `${REPO}/blob/main/content/${collection}/${id}.md`;

/** 상세 페이지 경로 */
export const resourcePath = (id: string) => href(`${id}/`); // <domain>/<category>/<slug>
export const modelPath = (id: string) => href(`models/${id}/`);
export const knowledgePath = (id: string) => href(`knowledge/${id}/`);
export const languagePath = (id: string) => href(`languages/${id}/`);
