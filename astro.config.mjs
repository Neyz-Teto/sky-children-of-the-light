import { defineConfig } from 'astro/config';

const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
const site = process.env.PUBLIC_SITE_URL || (owner ? `https://${owner}.github.io` : 'https://example.invalid');
const base = process.env.GITHUB_REPOSITORY && repo !== `${owner}.github.io` ? `/${repo}` : '';

export default defineConfig({
  site,
  base,
  output: 'static',
});
