const sites = [
  { name: "正式主站", url: "https://turkiye-news.pages.dev" },
  ...Array.from({ length: 10 }, (_, i) => ({
    name: `衍生站 ${i + 1}`,
    url: `https://turkiye-yasam-${i + 1}.pages.dev`,
  })),
];

const results = await Promise.all(sites.map(async (site) => {
  try {
    const response = await fetch(site.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      headers: { "user-agent": "TurkiyeNews-UptimeMonitor/1.0" },
    });
    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();
    const isHtml = contentType.includes("text/html") && /<html[\s>]/i.test(html);
    return {
      ...site,
      ok: response.status === 200 && isHtml,
      status: response.status,
      detail: response.status !== 200
        ? `HTTP ${response.status}`
        : !isHtml ? `Unexpected response content-type: ${contentType || "missing"}` : "OK",
    };
  } catch (error) {
    return { ...site, ok: false, status: "ERROR", detail: error?.message || String(error) };
  }
}));

const failures = results.filter((item) => !item.ok);
const lines = [
  "# GÜNCE 网站可用性巡检",
  `巡检时间：${new Date().toISOString()}`,
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
await import("node:fs/promises").then(({ writeFile }) =>
  writeFile("health-report.md", report, "utf8")
);
if (failures.length > 0) process.exitCode = 1;
