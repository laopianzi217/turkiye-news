# GÜNCE 手动文章发布模板

手动文章统一保存在 `src/data/articles.json`，页面由 `src/pages/yazi/[slug].astro` 自动生成。不要为每篇文章单独制作 HTML。

## 新增文章时复制此数据结构

将下面对象添加到 `src/data/articles.json` 数组中。对象之间用逗号分隔，注意 JSON 不支持注释和末尾逗号。

```json
{
  "slug": "ornek-makale-basligi",
  "title": "Türkçe makale başlığı",
  "description": "首页和搜索结果使用的简短摘要。",
  "category": "moda",
  "label": "Editoryal",
  "date": "2026-11-26",
  "readTime": "4 dk",
  "image": "https://example.com/article-cover.jpg",
  "imageAlt": "图片内容的简短说明",
  "imageCaption": "图片来源 / 摄影者（如适用）",
  "content": [
    {
      "heading": "第一个小标题",
      "paragraphs": [
        "第一段正文。",
        "第二段正文。"
      ]
    },
    {
      "heading": "第二个小标题",
      "paragraphs": [
        "继续填写正文。"
      ],
      "image": "https://example.com/inline-photo.jpg",
      "imageAlt": "正文图片说明",
      "imageCaption": "正文图片来源（如适用）"
    }
  ],
  "sources": []
}
```

## 字段填写规则

- `slug`：必填，使用小写英文字母/数字和短横线，不能与现有文章重复。
- `title`、`description`：土耳其语标题和摘要。
- `category`：必须使用 `data/categories.json` 中已有的分类 ID，例如 `moda`、`guzellik`、`yeme-icme`、`saglik`、`spor`、`seyahat`。
- `date`：`YYYY-MM-DD` 格式。
- `readTime`：例如 `4 dk`。
- `image`：主图的 HTTPS 图片地址；留空或省略时使用站点的编辑视觉占位图。图片应由你拥有或已获准使用。
- `imageAlt`：图片替代文字；`imageCaption`：图片说明或署名。
- `content`：按顺序添加段落和小标题。需要正文图片时，在对应 section 添加 `image`、`imageAlt` 和 `imageCaption`。
- `sources`：记录事实来源；转载正文和图片前必须确认相应许可。

## 发布步骤

1. 打开 GitHub 仓库中的 `src/data/articles.json`。
2. 点击编辑，将新文章对象添加到数组最前面（首页会优先展示较新的手动文章）。
3. 保存并提交（Commit changes）。
4. GitHub Actions 自动构建；成功后 Cloudflare Pages 部署网站。
5. 文章详情页地址为 `https://turkiye-yasam.pages.dev/yazi/你的-slug/`。

## 图片提示

目前模板接受可公开访问的 HTTPS 图片地址。不要填写电脑本地路径（例如 `C:\\Users\\...\\photo.jpg`），也不要使用未经许可的图片。若要将图片直接上传到仓库，可先放入仓库的 `public/images/` 目录，再在 `image` 字段填写 `/images/文件名.jpg`；上传图片需在 GitHub 网页端单独添加文件。

## 重要

当前首页和分类页的文章卡片、文章详情页均共用这套数据。不要直接修改 HTML 页面来发布单篇文章；只需新增数据即可保持全站 UI 一致。
