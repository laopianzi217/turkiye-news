import type { APIRoute } from 'astro';
import categories from '../../data/categories.json';
import articles from '../data/articles.json';
import news from '../data/news.json';

const SITE = 'https://turkiye-yasam.pages.dev';
const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export const GET: APIRoute = () => {
  const entries = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    ...categories.categories.map((category) => ({ path: `/kategori/${category.slug}/`, priority: '0.7', changefreq: 'weekly' })),
    ...articles.map((article) => ({ path: `/yazi/${article.slug}/`, date: article.date, priority: '0.8', changefreq: 'monthly' })),
    ...news.map((item) => ({ path: `/haber/${item.slug}/`, date: item.publishedAt, priority: '0.8', changefreq: 'weekly' }))
  ];
  const unique = [...new Map(entries.map((entry) => [entry.path, entry])).values()];
  const body = unique.map((entry) => {
    const lastmod = entry.date ? new Date(entry.date).toISOString() : '';
    return `<url><loc>${escapeXml(new URL(entry.path, SITE).href)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
