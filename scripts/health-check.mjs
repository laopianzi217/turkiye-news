import fs from "node:fs/promises";

const registryPath = "data/derivatives.json";
const registry = JSON.parse(await fs.readFile(registryPath, "utf8"));
if (!Array.isArray(registry)) throw new Error("data/derivatives.json must be a JSON array");

const derivatives = registry.map((entry) => {
  const repository = typeof entry === "string" ? entry : entry?.repository;
  const pagesProject = typeof entry === "string"
    ? repository?.split("/").at(-1)?.toLowerCase()
    : entry?.pages_project;
  if (typeof repository !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error(`Invalid derivative repository entry: ${JSON.stringify(entry)}`);
  }
  if (typeof pagesProject !== "string" || !/^[a-z0-9][a-z0-9-]{0,57}$/.test(pagesProject)) {
    throw new Error(`Invalid Cloudflare Pages project name for ${repository}: ${pagesProject}`);
  }
  return { repository, pagesProject };
});

const uniqueProjects = new Set(derivatives.map((item) => item.pagesProject));
if (uniqueProjects.size !== derivatives.length) {
  throw new Error("Duplicate Cloudflare Pages project names found in data/derivatives.json");
}

const sites = [
  { name: "正式主站", url: "https://turkiye-news.pages.dev" },
  ...derivatives.map((item) => ({
    name: item.repository.split("/").at(-1),
    url: `https://${item.pagesProject}.pages.dev`,
  })),
];

const results = await Promise.all(sites.map(async (site) => {
  try {
    const response = await fetch(site.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      headers: { "user-agent": "TurkiyeNews-UptimeMonitor/1.1" },
    });
    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();
    const isHtml = contentType.includes("text/html") && /<html[\s>]/i.test(html);
    return {
      ...site,
      ok: response.status === 200 && isHtml,
      detail: response.status !== 200
        ? `HTTP ${response.status}`
        : !isHtml ? `Unexpected response content-type: ${contentType || "missing"}` : "OK",
    };
  } catch (error) {
    return { ...site, ok: false, detail: error?.message || String(error) };
  }
}));

const failures = results.filter((item) => !item.ok);
const lines = [
  "# GÜNCE 网站可用性巡检",
  `巡检时间：${new Date().toISOString()}`,
  `检查范围：正式主站 + ${derivatives.length} 个登记的衍生站`,
  `结果：${results.length - failures.length}/${results.length} 个网站正常`,
  "",
  "| 网站 | 地址 | 结果 |",
  "|---|---|---|",
  ...results.map((item) =>
    `| ${item.name} | ${item.url} | ${item.ok ? "正常" : `异常：${item.detail}`} |`
  ),
];
const report = lines.join("\n") + "\n";
console.log(report);
await fs.writeFile("health-report.md", report, "utf8");
if (failures.length > 0) process.exitCode = 1;
