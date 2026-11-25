# 新闻内容模型（无数据库方案）

本文件定义静态新闻站初期的文件数据结构。所有内容保存在 Git 仓库中，不创建数据库，不提供用户注册或登录。

## 1. 设计原则

- 一篇新闻一个 Markdown 文件，避免把所有新闻写进单个 JSON。
- 文件名使用稳定 ID，不使用标题作为唯一标识。
- 新闻记录必须保留来源链接、来源名称、原始发布时间和采集时间。
- 只存储获准保存的字段；授权状态不明确时不保存来源正文。
- 文章状态与审核状态分离；重大新闻不得仅靠自动规则发布。
- 时间统一以 ISO 8601 UTC 保存，前端按土耳其时区显示。

## 2. 推荐目录

```text
content/
  news/
    2026/
      11/
        <article-id>.md

data/
  sources.json
  categories.json
  source-state/
    <source-id>.json
  dedup/
    2026-11.json
  review/
    pending.json
  metrics/
    2026-11.json
```

## 3. Markdown Frontmatter 字段

| 字段 | 类型 | 必需 | 说明 |
|---|---|---:|---|
| id | string | 是 | 稳定内部 ID |
| title | string | 是 | 原创土耳其语标题 |
| description | string | 是 | 简短摘要，用于列表与 SEO |
| summary | string | 是 | 原创土耳其语新闻摘要 |
| source_id | string | 是 | 对应 sources.json 中的来源 ID |
| source_name | string | 是 | 来源展示名称 |
| source_url | URL | 是 | 指向原始新闻的规范链接 |
| source_item_id | string/null | 否 | RSS / API 提供的稳定条目 ID |
| source_published_at | datetime/null | 否 | 来源发布时间，UTC |
| collected_at | datetime | 是 | 采集时间，UTC |
| updated_at | datetime | 是 | 本站记录更新时间，UTC |
| category | string | 是 | 主分类 ID |
| tags | string[] | 否 | 土耳其语标签 |
| language | string | 是 | 固定为 tr |
| status | enum | 是 | draft / review / published / rejected |
| importance | enum | 是 | normal / important / major |
| verification | enum | 是 | unverified / single_source / cross_checked / official |
| reviewed_at | datetime/null | 否 | 人工审核时间 |
| reviewed_by | string/null | 否 | 审核者标识；不保存个人敏感信息 |
| correction_note | string/null | 否 | 更正说明 |

## 4. 文章示例（虚构样例，不代表真实新闻）

```yaml
---
id: "sample-20261125-001"
title: "Örnek haber başlığı"
description: "Örnek haber için kısa ve özgün açıklama."
summary: "Bu metin yalnızca içerik şablonunu göstermek için hazırlanmış kurgusal bir örnektir."
source_id: "sample-official"
source_name: "Örnek Resmî Kaynak"
source_url: "https://example.com/news/sample"
source_item_id: null
source_published_at: null
collected_at: "2026-11-25T12:00:00Z"
updated_at: "2026-11-25T12:00:00Z"
category: "turkiye"
tags: ["örnek"]
language: "tr"
status: "draft"
importance: "normal"
verification: "unverified"
reviewed_at: null
reviewed_by: null
correction_note: null
---
Bu içerik yalnızca şablon örneğidir; gerçek haber değildir.
```

## 5. 来源配置（sources.json）

每个来源建议包含：

- id、name、homepage、feed_url
- type（media / government / public）
- language（tr）
- enabled（默认 false）
- permission_status（unknown / pending / approved / denied）
- permission_reference（许可文件或官方条款 URL）
- allowed_fields（仅列出明确允许保存的字段）
- attribution_template
- poll_interval_minutes（项目固定 30 分钟）
- last_checked_at、last_success_at
- notes

**安全默认值：** enabled=false、permission_status=unknown。只有经项目所有者确认并有清晰许可依据的来源才可启用。

## 6. 分类建议（初版）

- turkiye — Türkiye
- dunya — Dünya
- ekonomi — Ekonomi
- politika — Politika
- spor — Spor
- teknoloji — Teknoloji
- saglik — Sağlık
- egitim — Eğitim
- kultur-sanat — Kültür-Sanat
- yasam — Yaşam
- cevre — Çevre

分类可在实际新闻源测试后调整，但 URL slug 应保持稳定，避免频繁变更 SEO 地址。

## 7. 去重规则

按优先级组合判断：

1. source_id + source_item_id
2. 规范化 source_url（移除追踪参数、统一尾部斜杠）
3. 标题规范化哈希 + 发布时间窗口（仅作辅助，不能单独作为绝对依据）

不要仅凭相似标题就合并不同新闻。疑似重复应保留审核记录。

## 8. 发布规则

- draft：刚采集或待编辑，默认不公开。
- review：进入人工审核，重大新闻必须使用此状态。
- published：通过质量与许可检查后公开。
- rejected：拒绝发布，记录原因。

importance 与 verification 的建议规则：

- normal：来源可靠、许可允许、信息完整，可按已批准规则自动发布。
- important：要求关键事实有第二个独立来源交叉验证。
- major：必须人工审核；单一来源不得自动发布。
- official：表示信息来自相关政府 / 公共机构官方发布，不代表其他来源的事实已被独立核实。

## 9. 不应存储的内容

- 未获授权的全文、图片、视频或音频。
- 不必要的个人数据。
- 访问控制绕过后获得的内容。
- API 密钥、Cookie、登录凭据或任何秘密。
