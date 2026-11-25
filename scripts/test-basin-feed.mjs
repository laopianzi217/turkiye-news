const feedUrl = 'https://basinbultenleri.com/feed';
const response = await fetch(feedUrl, {
  headers: { 'user-agent': 'Gunce-News-Reader/1.0', accept: 'application/rss+xml, application/xml, text/xml' },
  redirect: 'error',
  signal: AbortSignal.timeout(15000)
});
if (!response.ok) throw new Error('Basin feed HTTP ' + response.status);
const bytes = new Uint8Array(await response.arrayBuffer());
if (bytes.byteLength > 1_500_000) throw new Error('Basin feed exceeds 1.5 MB');
const xml = new TextDecoder('utf-8').decode(bytes);
const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item\s*>/gi)].map(m => m[1]);
const raw = (block, names) => {
  for (const name of names) {
    const m = block.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '\\s*>', 'i'));
    if (m) return m[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
  }
  return '';
};
const plain = value => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/\s+/g, ' ').trim();
const attr = (tag, name) => {
  const m = tag.match(new RegExp("\\b" + name + "=(?:\\"([^\\"]+)\\"|'([^']+)')", 'i'));
  return m ? (m[1] || m[2] || '') : '';
};
const count = { total: items.length, title: 0, guid: 0, link: 0, summary: 0, content: 0, published: 0, organization: 0, category: 0, image: 0 };
for (const block of items) {
  if (raw(block, ['title'])) count.title++;
  if (raw(block, ['guid', 'id'])) count.guid++;
  const linkTag = block.match(/<link\b[^>]*>([\s\S]*?)<\/link\s*>/i)?.[0] || '';
  if (plain(linkTag.replace(/^<link\b[^>]*>|<\/link\s*>$/gi, '')) || attr(linkTag.match(/^<link\b[^>]*>/i)?.[0] || '', 'href')) count.link++;
  if (raw(block, ['description', 'summary'])) count.summary++;
  if (raw(block, ['content:encoded', 'content'])) count.content++;
  if (raw(block, ['pubDate', 'published', 'updated', 'dc:date'])) count.published++;
  if (raw(block, ['dc:creator', 'press:organization', 'author', 'source', 'organization'])) count.organization++;
  if (/<category\b/i.test(block)) count.category++;
  if (/<(?:enclosure|media:content|media:thumbnail)\b[^>]*\burl=/i.test(block)) count.image++;
}
console.log('Basin Bültenleri dry-run field coverage (no article text or image URLs printed):');
console.log(JSON.stringify(count));
if (!count.total || count.title !== count.total || count.guid !== count.total || (count.content + count.summary) === 0) {
  throw new Error('Basin feed failed core RSS field validation.');
}
if (count.link === 0 || count.published === 0) throw new Error('Basin feed is missing article links or publication dates.');
