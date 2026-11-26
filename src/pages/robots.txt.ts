import type { APIRoute } from 'astro';

export const GET: APIRoute = () => new Response(
  'User-agent: *\nAllow: /\n\nSitemap: https://turkiye-yasam.pages.dev/sitemap.xml\n',
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
);
