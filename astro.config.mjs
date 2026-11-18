// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages 프로젝트 페이지: https://sgustjd2.github.io/develop-wiki/
export default defineConfig({
  site: 'https://sgustjd2.github.io',
  base: '/develop-wiki',
  trailingSlash: 'always',
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
