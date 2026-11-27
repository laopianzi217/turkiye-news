import { readFile } from "node:fs/promises";

const newsPath = "src/data/news.json";
const protectionPath = "data/content-protection.json";
const errors = [];

let news;
let protection;
try {
  news = JSON.parse(await readFile(newsPath, "utf8"));
  if (!Array.isArray(news)) throw new Error("news.json top level must be an array");
} catch (error) {
  console.error("Cannot parse src/data/news.json:", error.message);
  process.exit(1);
}

try {
  protection = JSON.parse(await readFile(protectionPath, "utf8"));
  if (!protection || typeof protection !== "object" || Array.isArray(protection)) {
    throw new Error("content-protection.json must contain an object");
  }
} catch (error) {
  console.error("Cannot parse data/content-protection.json:", error.message);
  process.exit(1);
}

const ids = new Set();
const slugs = new Set();
for (const [index, item] of news.entries()) {
  const label = `news.json item #${index + 1}`;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    errors.push(`${label} is not an object`);
    continue;
  }
  for (const field of ["id", "slug", "sourceId", "title", "description", "contentHtml", "category", "publishedAt"]) {
    if (typeof item[field] !== "string" || !item[field].trim()) {
      errors.push(`${label} has a missing or empty required field: ${field}`);
    }
  }
  if (item.id) {
    if (ids.has(item.id)) errors.push(`Duplicate article id: ${item.id}`);
    ids.add(item.id);
  }
  if (item.slug) {
    if (slugs.has(item.slug)) errors.push(`Duplicate article slug: ${item.slug}`);
    slugs.add(item.slug);
  }
  if (item.publishedAt && !Number.isFinite(Date.parse(item.publishedAt))) {
    errors.push(`${label} has an invalid publishedAt date`);
  }
}

const protectedIds = Array.isArray(protection.protectedManualIds)
  ? protection.protectedManualIds
  : [];
for (const id of protectedIds) {
  if (typeof id !== "string" || !id.trim()) {
    errors.push("content-protection.json contains an invalid protected manual article id");
  } else if (!ids.has(id)) {
    errors.push(`Protected manual article is missing: ${id}`);
  }
}

const sponsorRules = Array.isArray(protection.sponsors) ? protection.sponsors : [];
for (const rule of sponsorRules) {
  if (!rule || typeof rule.sourceId !== "string" ||
      !Number.isInteger(rule.minItems) || !Number.isInteger(rule.maxItems) ||
      rule.minItems < 0 || rule.maxItems < rule.minItems) {
    errors.push("content-protection.json contains an invalid sponsor rule");
    continue;
  }
  const count = news.filter((item) => item?.sourceId === rule.sourceId).length;
  if (count < rule.minItems || count > rule.maxItems) {
    errors.push(`Sponsor ${rule.sourceId}: expected ${rule.minItems}-${rule.maxItems} article(s), found ${count}`);
  }
}

console.log(`Content integrity check: ${news.length} article(s), ${protectedIds.length} protected manual article(s), ${sponsorRules.length} sponsor rule(s).`);
if (errors.length) {
  console.error("CONTENT INTEGRITY CHECK FAILED:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("Content integrity check passed. No article content was modified.");
