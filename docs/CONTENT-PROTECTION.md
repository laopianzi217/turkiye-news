# 新闻文章完整性保护说明

本说明适用于新闻数据文件 `src/data/news.json`，不适用于编辑文章文件 `src/data/articles.json`。

## 保护机制做什么

- `scripts/content-integrity-check.mjs` 只读取并检查数据，不会自动删除、改写或修复任何文章。
- `data/content-protection.json` 中的 `protectedManualIds` 列出必须保留的手动新闻文章 ID。
- 每次新闻采集后，以及独立完整性监控运行时，都会检查保护名单中的文章是否仍存在。
- 如果保护文章缺失、JSON格式错误、文章ID或slug重复、必填字段缺失，监控会失败并创建/更新 GitHub Issue；恢复正常后会自动关闭告警。
- MatrixQR 的赞助商文章数量规则也记录在同一配置文件中。

## 新增手动新闻后如何登记保护

1. 在 `src/data/news.json` 中新增文章并提交。
2. 复制该文章对象中的 `id` 字段原值。
3. 打开 `data/content-protection.json`，将 ID 作为字符串添加到 `protectedManualIds` 数组。
4. 保存并提交。JSON数组中每项之间用逗号分隔，最后一项后面不要加逗号。
5. 检查 GitHub Actions 中 **Content integrity protection** 是否成功。

例如，若新文章的 ID 是 `manual:example-20261127`，配置应类似：

```json
{
  "protectedManualIds": [
    "replikasaatblog:a97b18c57659022c4e79",
    "manual:example-20261127"
  ],
  "sponsors": [
    {
      "sourceId": "matrixqr-blog",
      "minItems": 1,
      "maxItems": 1
    }
  ]
}
```

上例仅演示格式；添加时必须保留文件中现有的真实 ID 和赞助商规则，不要整段覆盖成示例内容。

## 修改或下架文章时

- 如果确实决定下架一篇受保护文章，先确认下架决定，再从 `protectedManualIds` 中移除对应 ID；否则监控会按设计报告文章缺失。
- 不要为了让检查通过而直接删除文章或清空保护名单。
- 如需修改文章内容，只修改目标文章字段，并保留其 `id`；改完后确认完整性检查通过。

## 重要边界

完整性检查是告警和防误删机制，不是备份系统，也不会自动恢复已删除的文章。Git历史可用于查找先前版本，但恢复前应先核对文章内容和目标版本。
