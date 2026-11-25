import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sourceConfig = JSON.parse(await readFile('data/sources.json', 'utf8'));
const categoryConfig = JSON.parse(await readFile('data/categories.json', 'utf8'));
const outputPath = 'src/data/news.json';
const existing = JSON.parse(await readFile(outputPath, 'utf8').catch(() => '[]'));
const validCategories = new Set(categoryConfig.categories.map((item) => item.id));
const now = Date.now();
const maxAge = 30 * 24 * 60 * 60 * 1000;
const maxFeedBytes = 1_500_000;
const BLOCKED = /\b(seçim|siyaset|siyasi|parti|meclis|bakan|cumhurbaşkanı|savaş|terör|terörist|cinayet|öldürüldü|ölü bulundu|saldırı|patlama|gözaltı|tutuklandı|mahkeme|dava|kaza|yaralı|hayatını kaybetti|deprem|sel felaketi|yangın|uyuşturucu|silah|şiddet|tecavüz|istismar)\b/i;

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function rawTag(xml, names) {
  for (const name of names) {
    const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = xml.match(new RegExp('<' + safe + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + safe + '\\s*>', 'i'));
    if (match) return match[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
  }
  return '';
}

function plainText(value = '') {
  return decodeXml(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function attribute(tag, name) {
  const match = tag.match(new RegExp('\\b' + name + '=["\\']([^"\\']+)["\\']', 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

function cleanUrl(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    return url.toString();
  } catch { return ''; }
}

function imageFrom(block) {
  const enclosure = block.match(/<enclosure\b[^>]*>/i)?.[0];
  const media = block.match(/<(?:media:content|media:thumbnail)\b[^>]*>/i)?.[0];
  return cleanUrl(attribute(enclosure || media || '', 'url'));
}

function safeHtml(input = '') {
  let html = decodeXml(input);
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<(script|style|iframe|object|embed|form|svg|math|video|audio)[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  html = html.replace(/<(script|style|iframe|object|embed|form|svg|math|video|audio)\b[^>]*\/?\s*>/gi, '');
  html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/\s+(?:style|srcset|id|class)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  html = html.replace(/\s+(href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (whole, attr, quoted, dq, sq, bare) => {
    const value = dq ?? sq ?? bare ?? '';
    const url = cleanUrl(value);
    return url ? ' ' + attr.toLowerCase() + '="' + url.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"' : '';
  });
  const allowed = new Set(['p','br','strong','b','em','i','ul','ol','li','h2','h3','blockquote','a','img']);
  html = html.replace(/<\/?([a-z0-9:-]+)\b([^>]*)>/gi, (tag, rawName, attrs) => {
    const name = rawName.toLowerCase();
    if (!allowed.has(name)) return '';
    if (tag.startsWith('</')) return name === 'br' || name === 'img' ? '' : '</' + name + '>';
    let safeAttrs = '';
    if (name === 'a') {
      const href = attrs.match(/\shref="([^"]*)"/i)?.[1];
      if (href) safeAttrs += ' href="' + href + '" rel="nofollow noopener noreferrer"';
    }
    if (name === 'img') {
      const src = attrs.match(/\ssrc="([^"]*)"/i)?.[1];
      const alt = attrs.match(/\salt="([^"]*)"/i)?.[1] || '';
      if (!src) return '';
      safeAttrs += ' src="' + src + '" alt="' + alt.replace(/"/g, '&quot;') + '" loading="lazy"';
    }
    return '<' + name + safeAttrs + (name === 'br' || name === 'img' ? ' />' : '>');
  });
  return html.trim();
}

function categoryFor(text) {
  const value = text.toLocaleLowerCase('tr-TR');
  const rules = [
    ['moda', /moda|tekstil|giyim|tasarım|koleksiyon|defile/],
    ['guzellik', /güzellik|kozmetik|cilt bakımı|makyaj|parfüm|saç bakımı/],
    ['yeme-icme', /gastronomi|yemek|gıda|yiyecek|içecek|restoran|kahve|mutfak|şef|tarif/],
    ['saglik', /sağlık|wellness|beslenme|fitness|iyi yaşam/],
    ['spor', /spor|futbol|basketbol|voleybol|tenis|atletizm/],
    ['alisveris', /alışveriş|perakende|mağaza|marka|e-ticaret|tüketici/],
    ['teknoloji', /teknoloji|yapay zeka|yazılım|dijital|mobil|uygulama/],
    ['seyahat', /turizm|seyahat|otel|havayolu|tatil|destinasyon/],
    ['kultur-sanat', /kültür|sanat|sergi|müze|sinema|tiyatro|müzik/],
    ['turkiye', /yerel yönetim|belediye|şehir|ilçe|türkiye/]
  ];
  for (const [id, pattern] of rules) if (pattern.test(value)) return id;
  return 'yasam';
}

function parseEntries(xml) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item\s*>/gi)].map((match) => {
    const block = match[1];
    const title = plainText(rawTag(block, ['title']));
    const guid = plainText(rawTag(block, ['guid', 'id']));
    const summary = plainText(rawTag(block, ['description', 'summary']));
    const body = rawTag(block, ['content:encoded', 'content']);
    const publishedRaw = plainText(rawTag(block, ['pubDate', 'published', 'updated', 'dc:date']));
    const publishedAt = publishedRaw && !Number.isNaN(Date.parse(publishedRaw)) ? new Date(publishedRaw).toISOString() : null;
    const organization = plainText(rawTag(block, ['dc:creator', 'press:organization', 'author']));
    const tags = [...block.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category\s*>/gi)].map((m) => plainText(m[1])).join(' ');
    const contentHtml = safeHtml(body || rawTag(block, ['description']));
    const image = imageFrom(block);
    return { title: title.slice(0, 240), guid, summary: summary.slice(0, 500), contentHtml, image, publishedAt, organization, tags };
  }).filter((item) => item.title && item.guid);
}

const enabled = sourceConfig.sources.filter((source) =>
  source.enabled === true &&
  ['approved', 'republishing_permitted_by_published_terms'].includes(source.permission_status) &&
  Array.isArray(source.allowed_fields) &&
  source.allowed_fields.includes('title') &&
  source.allowed_fields.includes('content_html') &&
  typeof source.feed_url === 'string'
);

const collected = [];
for (const source of enabled) {
  try {
    const feedUrl = new URL(source.feed_url);
    if (feedUrl.protocol !== 'https:' || feedUrl.hostname !== 'www.press.org.tr') throw new Error('Feed host is not on the approved HTTPS allowlist.');
    const response = await fetch(feedUrl, {
      headers: { 'user-agent': 'Gunce-News-Reader/1.0 (+https://turkiye-yasam.pages.dev)', accept: 'application/rss+xml, application/xml, text/xml' },
      redirect: 'error',
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxFeedBytes) throw new Error('Feed exceeds the 1.5 MB limit.');
    const xml = new TextDecoder('utf-8').decode(bytes);
    const entries = parseEntries(xml);
    for (const entry of entries) {
      const publishedMs = entry.publishedAt ? Date.parse(entry.publishedAt) : now;
      if (now - publishedMs > maxAge || publishedMs > now + 24 * 60 * 60 * 1000) continue;
      if (BLOCKED.test(entry.title + ' ' + entry.summary)) continue;
      if (!entry.contentHtml && !entry.summary) continue;
      const digest = createHash('sha256').update(source.id + ':' + entry.guid).digest('hex').slice(0, 20);
      const category = categoryFor(entry.tags + ' ' + entry.title + ' ' + entry.summary);
      const organization = entry.organization || '';
      const sourceName = source.name;
      collected.push({
        id: source.id + ':' + digest,
        slug: 'pha-' + digest,
        sourceId: source.id,
        sourceGuid: entry.guid,
        title: entry.title,
        description: entry.summary || entry.title,
        contentHtml: entry.contentHtml,
        image: entry.image || null,
        publishedAt: entry.publishedAt,
        category: validCategories.has(category) ? category : 'yasam',
        sourceName,
        sourceOrganization: organization,
        attribution: organization ? 'Kaynak: ' + organization + ' · Press Haber Ajansı (PHA)' : 'Kaynak: Press Haber Ajansı (PHA)',
        url: null
      });
    }
    console.log(source.id + ': parsed ' + entries.length + ' entries; accepted ' + collected.length + ' safe lifestyle stories.');
  } catch (error) {
    console.error(source.id + ': ' + error.message);
    process.exitCode = 1;
  }
}

const merged = new Map();
for (const item of [...collected, ...existing]) {
  if (!item?.id || !item?.title) continue;
  const date = item.publishedAt ? Date.parse(item.publishedAt) : now;
  if (!Number.isFinite(date) || now - date > maxAge || date > now + 24 * 60 * 60 * 1000) continue;
  if (!merged.has(item.id)) merged.set(item.id, item);
}
const result = [...merged.values()]
  .sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0))
  .slice(0, 150);

if (JSON.stringify(result) !== JSON.stringify(existing)) {
  await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n');
  console.log('Saved ' + result.length + ' PHA news items.');
} else {
  console.log('No new PHA news items.');
}
