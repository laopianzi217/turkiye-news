import { readFile, writeFile } from 'node:fs/promises';

const sourceConfig = JSON.parse(await readFile('data/sources.json', 'utf8'));
const categoryConfig = JSON.parse(await readFile('data/categories.json', 'utf8'));
const outputPath = 'src/data/news.json';
const existing = JSON.parse(await readFile(outputPath, 'utf8').catch(() => '[]'));
const validCategories = new Set(categoryConfig.categories.map((item) => item.id));
const now = Date.now();
const maxAge = 30 * 24 * 60 * 60 * 1000;
const maxFeedBytes = 1_500_000;

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function tagValue(xml, names) {
  for (const name of names) {
    const match = xml.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '\\s*>', 'i'));
    if (match) return decodeXml(match[1]).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function atomLink(xml) {
  const match = xml.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return match ? decodeXml(match[1].trim()) : '';
}

function cleanUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

function parseEntries(xml) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)];
  return blocks.map((match) => {
    const block = match[2];
    const title = tagValue(block, ['title']);
    const link = cleanUrl(tagValue(block, ['link']) || atomLink(block) || tagValue(block, ['guid', 'id']));
    const published = tagValue(block, ['pubDate', 'published', 'updated', 'dc:date']);
    const date = published && !Number.isNaN(Date.parse(published)) ? new Date(published).toISOString() : null;
    const description = tagValue(block, ['description', 'summary']);
    return { title: title.slice(0, 240), url: link, publishedAt: date, description: description.slice(0, 260) };
  }).filter((item) => item.title && item.url);
}

const approved = sourceConfig.sources.filter((source) =>
  source.enabled === true &&
  source.permission_status === 'approved' &&
  Array.isArray(source.allowed_fields) &&
  source.allowed_fields.includes('title') &&
  source.allowed_fields.includes('link') &&
  typeof source.feed_url === 'string'
);

if (approved.length === 0) {
  console.log('No approved RSS sources are enabled. No external content was fetched.');
  process.exit(0);
}

const collected = [];
for (const source of approved) {
  try {
    const feedUrl = new URL(source.feed_url);
    if (feedUrl.protocol !== 'https:') throw new Error('Only HTTPS feed URLs are accepted.');
    const response = await fetch(feedUrl, {
      headers: { 'user-agent': 'Gunce-RSS-Reader/1.0 (+https://turkiye-yasam.pages.dev)', accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
      redirect: 'error',
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const length = Number(response.headers.get('content-length') || 0);
    if (length > maxFeedBytes) throw new Error('Feed exceeds the 1.5 MB limit.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxFeedBytes) throw new Error('Feed exceeds the 1.5 MB limit.');
    const xml = new TextDecoder('utf-8').decode(bytes);
    const entries = parseEntries(xml);
    for (const entry of entries) {
      const publishedMs = entry.publishedAt ? Date.parse(entry.publishedAt) : now;
      if (now - publishedMs > maxAge || publishedMs > now + 24 * 60 * 60 * 1000) continue;
      const item = {
        id: entry.url,
        title: entry.title,
        url: entry.url,
        publishedAt: entry.publishedAt,
        category: validCategories.has(source.category) ? source.category : 'yasam',
        sourceName: source.name
      };
      if (source.allowed_fields.includes('description') && entry.description) item.description = entry.description;
      collected.push(item);
    }
    console.log(source.id + ': ' + entries.length + ' feed entries parsed.');
  } catch (error) {
    console.error(source.id + ': ' + error.message);
  }
}

const merged = new Map();
for (const item of [...collected, ...existing]) {
  if (!item?.url || !item?.title) continue;
  const date = item.publishedAt ? Date.parse(item.publishedAt) : now;
  if (now - date > maxAge) continue;
  if (!merged.has(item.url)) merged.set(item.url, item);
}
const result = [...merged.values()]
  .sort((a, b) => (Date.parse(b.publishedAt || 0) || 0) - (Date.parse(a.publishedAt || 0) || 0))
  .slice(0, 150);

if (JSON.stringify(result) !== JSON.stringify(existing)) {
  await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
  console.log('Saved ' + result.length + ' RSS metadata items.');
} else {
  console.log('No new RSS metadata items.');
}
