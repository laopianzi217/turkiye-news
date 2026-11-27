# 衍生站点自动化说明

## 当前架构

- 主仓库：`laopianzi217/turkiye-news`
- 正式主站：`https://turkiye-news.pages.dev`
- 衍生仓库列表：`data/derivatives.json`
- 主仓库更新后，`.github/workflows/sync-derivatives.yml` 将 `main` 分支同步到登记的衍生仓库。
- 每个衍生仓库使用独立 Cloudflare Pages 项目；项目名记录在 `data/derivatives.json` 的 `pages_project` 字段中。
- 衍生仓库的 GitHub Actions Variable `CLOUDFLARE_PAGES_PROJECT` 决定其 Cloudflare Pages 项目名。
- 创建新衍生站后，必须确认其构建与 Cloudflare Pages 部署成功，再对外使用对应的 `.pages.dev` 地址。

## 当前衍生站点

前10个衍生站沿用编号命名，仓库名与 Pages 项目名相同：`turkiye-yasam-1` 至 `turkiye-yasam-10`。

## 从第11个开始自定义命名

在主仓库 GitHub Actions 中运行 **Create public derivative sites**：

1. 选择 `single`。
2. 在 `repository_name` 填写自定义 GitHub 仓库名，例如 `turkiye-fashion`。
3. 在 `pages_project_name` 填写 Cloudflare Pages 项目名；留空则自动使用仓库名（小写）。
4. 运行工作流。它会创建 Public 仓库、配置 Cloudflare Secrets 和 Pages 项目变量、推送主站代码，并将仓库与 Pages 项目名登记到 `data/derivatives.json`。
5. 检查新仓库的 **Build and deploy static site** 工作流成功后，访问 `https://页面项目名.pages.dev`。

批量编号模式仍可使用，项目名自动采用对应仓库名；批量模式不提供单独的 Pages 项目名。

## Dry Run 创建预演

运行 **Create public derivative sites** 时，`dry_run` 是一个布尔开关：

- `true`：只执行名称与资源冲突预检查，并在 Actions Summary 中列出计划创建的 GitHub 仓库和 Cloudflare Pages 项目；不会创建仓库、项目、Secrets，不会修改 `data/derivatives.json`。
- `false`：预检查通过后，按正常流程正式创建。默认值为 `false`，以兼容原有的直接创建操作；正式运行前请确认开关状态。

建议批量创建或首次使用自定义命名时，先用 `dry_run=true` 预演；确认计划清单无误后，再用相同参数以 `dry_run=false` 正式运行。预演只验证运行当时的资源状态，正式创建前仍会重新执行预检查。

## 创建前自动检查

每次运行创建工作流时，会先执行预检查，再创建或配置任何仓库：

- 检查本次批量输入中是否有重复的 GitHub 仓库名或 Cloudflare Pages 项目名。
- 检查 `data/derivatives.json`，兼容旧字符串格式和新对象格式，避免把同一个 Pages 项目分配给不同仓库。
- 检查 GitHub 上是否已有同名仓库；如果仓库存在但尚未登记，不会擅自接管，而是停止并要求人工核实。
- 查询 Cloudflare 账户现有 Pages 项目；如果目标项目名已被其他项目占用，停止创建。
- 如果 Cloudflare 项目清单无法可靠读取，预检查会失败关闭，不会冒险继续创建。
- 已在登记表中且仓库名与 Pages 项目映射一致的站点允许重复运行，不会误报为名称冲突。

预检查失败时，工作流会给出冲突名称和原因；先人工核实并调整输入或登记表，再重新运行。不会自动删除、改名或覆盖现有站点。

## 内容与密钥规则

- 新闻采集只在主仓库执行；衍生仓库不重复调用新闻来源 API。
- 当前阶段衍生仓库同步主仓库内容，因此各站内容保持一致。
- Cloudflare API Token、Account ID 和 GitHub 管理令牌只保存在 GitHub Actions Secrets，不写入仓库文件。
- 衍生站使用独立 Cloudflare Pages 项目，不能将项目名改成主站 `turkiye-news`。
- 仓库同步只更新代码与内容，不会改变已配置的 Cloudflare Pages 项目变量。

## 日常维护

1. 在主仓库提交代码或内容更新。
2. 检查主仓库的同步工作流是否成功。
3. 检查衍生仓库的 Build and deploy 工作流是否成功。
4. 如同步失败，先查看失败仓库和具体错误，不要手动覆盖主仓库或删除站点内容。
