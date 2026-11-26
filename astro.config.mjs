import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://turkiye-yasam.pages.dev';

export default defineConfig({
  site,
  output: 'static',
});
