# 内容模型（无数据库方案）

本文件定义土耳其语时尚与消费生活资讯站的静态内容结构。内容保存在 Git 仓库中，不创建数据库，不提供用户注册或登录。

## 1. 设计原则

- 一篇文章一个 Markdown 文件，避免把所有内容写入单个 JSON。
- 文件名使用稳定 ID，不使用标题作为唯一标识。
- 文章应记录作者 / 编辑状态、事实来源、原始链接（如有）、核验时间和更新时间。
- 只保存来源许可允许保存的字段；授权状态不明确时不保存来源正文或媒体文件。
- 文章状态与审核状态分离；重大或高风险内容不得仅靠自动规则发布。
- 时间统一以 ISO 8601 UTC 保存，前端按土耳其时区显示。

## 2. 推荐目录

```text
content/
  articles/
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
| description | string | 是 | 简短原创摘要，用于列表与 SEO |
| content_type | string | 是 | news / guide / explainer / trend / review |
| category | string | 是 | 主分类 ID |
| tags | string[] | 否 | 土耳其语标签 |
| language | string | 是 | 固定为 tr |
| published_at | datetime | 是 | 本站发布时间，UTC |
| updated_at | datetime | 是 | 本站记录更新时间，UTC |
| sources | object[] | 视情况 | 事实来源名称、URL、发布日期和核验说明 |
| author | string | 否 | 作者或编辑署名 |
| status | enum | 是 | draft / review / published / rejected |
| importance | enum | 是 | normal / important / major |
| verification | enum | 是 | unverified / single_source / cross_checked / official |
| reviewed_at | datetime/null | 否 | 人工审核时间 |
| correction_note | string/null | 否 | 更正说明 |

## 4. 分类

分类 ID、土耳其语名称与 URL slug 统一维护在 `data/categories.json`。初始重点栏目：

- moda — Moda
- guzellik — Güzellik
- yeme-icme — Yeme-İçme
- saglik — Sağlık
- spor — Spor
- alisveris — Alışveriş
- teknoloji — Teknoloji
- seyahat — Seyahat
- yasam — Yaşam
- kultur-sanat — Kültür-Sanat
- turkiye — Türkiye

## 5. 内容类型

- news：有明确时间和事实来源的动态资讯。
- guide：实用指南，例如穿搭、饮食、旅行或购物建议。
- explainer：对公开资料、研究或政策的原创解释。
- trend：基于可核实资料的趋势观察。
- review：产品或服务体验 / 评测；必须披露样品、赞助或商业关系。

## 6. 来源记录

每条来源记录建议包含 source_name、source_url、source_published_at、accessed_at、license_reference（如适用）和 attribution_note。只记录发布和存储所需且获准的字段，不默认保存来源全文或图片。

## 7. 发布规则

- draft：起草或待事实核验，默认不公开。
- review：进入人工审核。
- published：通过事实、版权、编辑和质量检查后公开。
- rejected：拒绝发布并记录原因。

普通内容可以在来源许可和质量规则均明确后按批准规则自动发布。健康高风险信息、重大事件、指控和敏感内容必须人工审核。

## 8. 不应存储的内容

- 未获授权的全文、图片、视频或音频。
- 不必要的个人数据。
- 通过绕过访问控制获得的内容。
- API 密钥、Cookie、登录凭据或任何秘密。
