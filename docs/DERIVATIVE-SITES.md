# 衍生站点自动化说明

## 当前架构

- 主仓库：`laopianzi217/turkiye-news`
- 正式主站：`https://turkiye-news.pages.dev`
- 衍生仓库列表：`data/derivatives.json`
- 主仓库更新后，`.github/workflows/sync-derivatives.yml` 将 `main` 分支同步到登记的衍生仓库。
- 每个衍生仓库使用自己的仓库名作为 Cloudflare Pages 项目名，由 `.github/workflows/site-build.yml` 独立构建和部署。
- 同步名单中的每一行都会处理，包括文件末尾最后一项；修改同步工作流本身时，需通过其他主仓库提交触发一次同步。

## 当前衍生站点

| 仓库 | Cloudflare Pages 地址 |
|---|---|
| [turkiye-yasam-1](https://github.com/laopianzi217/turkiye-yasam-1) | https://turkiye-yasam-1.pages.dev |
| [turkiye-yasam-2](https://github.com/laopianzi217/turkiye-yasam-2) | https://turkiye-yasam-2.pages.dev |
| [turkiye-yasam-3](https://github.com/laopianzi217/turkiye-yasam-3) | https://turkiye-yasam-3.pages.dev |
| [turkiye-yasam-4](https://github.com/laopianzi217/turkiye-yasam-4) | https://turkiye-yasam-4.pages.dev |
| [turkiye-yasam-5](https://github.com/laopianzi217/turkiye-yasam-5) | https://turkiye-yasam-5.pages.dev |
| [turkiye-yasam-6](https://github.com/laopianzi217/turkiye-yasam-6) | https://turkiye-yasam-6.pages.dev |
| [turkiye-yasam-7](https://github.com/laopianzi217/turkiye-yasam-7) | https://turkiye-yasam-7.pages.dev |
| [turkiye-yasam-8](https://github.com/laopianzi217/turkiye-yasam-8) | https://turkiye-yasam-8.pages.dev |
| [turkiye-yasam-9](https://github.com/laopianzi217/turkiye-yasam-9) | https://turkiye-yasam-9.pages.dev |
| [turkiye-yasam-10](https://github.com/laopianzi217/turkiye-yasam-10) | https://turkiye-yasam-10.pages.dev |

## 内容与密钥规则

- 新闻采集只在主仓库执行；衍生仓库不重复调用新闻来源 API。
- 当前阶段衍生仓库同步主仓库内容，因此各站内容保持一致。
- Cloudflare API Token、Account ID 和 GitHub 管理令牌只保存在 GitHub Actions Secrets，不写入仓库文件。
- 衍生站使用独立 Cloudflare Pages 项目，不能将项目名改成主站 `turkiye-news`。
- 创建新衍生站后，必须确认其构建与 Cloudflare Pages 部署成功，再对外使用对应的 `.pages.dev` 地址。

## 日常维护

1. 在主仓库提交代码或内容更新。
2. 检查主仓库的同步工作流是否成功。
3. 检查衍生仓库的 Build and deploy 工作流是否成功。
4. 如同步失败，先查看失败仓库和具体错误，不要手动覆盖主仓库或删除站点内容。
