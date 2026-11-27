#!/usr/bin/env bash
set -euo pipefail

repo="${GITHUB_REPOSITORY:-laopianzi217/turkiye-news}"
summary="${GITHUB_STEP_SUMMARY:-/tmp/operations-report.md}"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

cat > "$summary" <<'EOF'
# 土耳其新闻站｜统一运行状态报告

本报告只读取 GitHub Actions 运行记录，不修改新闻数据、不提交代码，也不触发采集、构建或部署。

| 项目 | 最近一次运行 | 状态 | 时间 | 运行记录 |
|---|---|---|---|---|
EOF

check_workflow() {
  local label="$1"
  local file="$2"
  local response count status conclusion created url title result
  response="$(gh api "repos/$repo/actions/workflows/$file/runs?branch=main&per_page=1")"
  count="$(jq '.workflow_runs | length' <<< "$response")"
  if [ "$count" -eq 0 ]; then
    printf '| %s | — | ⚪ 尚无记录 | — | — |\n' "$label" >> "$summary"
    return
  fi
  status="$(jq -r '.workflow_runs[0].status // "unknown"' <<< "$response")"
  conclusion="$(jq -r '.workflow_runs[0].conclusion // empty' <<< "$response")"
  created="$(jq -r '.workflow_runs[0].created_at // "—"' <<< "$response")"
  url="$(jq -r '.workflow_runs[0].html_url // ""' <<< "$response")"
  title="$(jq -r '.workflow_runs[0].display_title // "—"' <<< "$response" | tr '|' '/')"
  if [ "$status" = "completed" ]; then
    case "$conclusion" in
      success) result="✅ 成功" ;;
      failure) result="❌ 失败" ;;
      cancelled) result="⚪ 已取消" ;;
      skipped) result="⚪ 已跳过" ;;
      *) result="⚪ $conclusion" ;;
    esac
  else
    result="🟡 运行中（$status）"
  fi
  printf '| %s | %s | %s | %s | [查看](%s) · %s |\n' "$label" "$title" "$result" "$created" "$url" "$file" >> "$summary"
}

check_workflow "新闻采集（每30分钟）" "collect-rss.yml"
check_workflow "主站构建与部署" "site-build.yml"
check_workflow "衍生仓库同步" "sync-derivatives.yml"
check_workflow "网站可用性巡检（每两天）" "site-health.yml"
check_workflow "内容完整性检查（每日）" "content-integrity.yml"

derivatives_json="$(gh api "repos/$repo/contents/data/derivatives.json" --jq '.content' | tr -d '\n' | base64 -d)"
derivative_count="$(jq 'length' <<< "$derivatives_json")"

{
  echo
  echo "## 衍生站部署状态"
  echo
  echo "| 衍生仓库 | 网站 | 最近一次部署 | 状态 | 时间 |"
  echo "|---|---|---|---|---|"
} >> "$summary"

while IFS= read -r entry; do
  derivative_repo="$(jq -r '.repository' <<< "$entry")"
  pages_project="$(jq -r '.pages_project' <<< "$entry")"
  endpoint="https://api.github.com/repos/$derivative_repo/actions/workflows/site-build.yml/runs"
  if response="$(curl --silent --show-error --fail --max-time 20 \
      --header 'Accept: application/vnd.github+json' \
      --header 'X-GitHub-Api-Version: 2022-11-28' \
      --get "$endpoint" --data-urlencode 'branch=main' --data-urlencode 'per_page=1' 2>/dev/null)"; then
    count="$(jq '.workflow_runs | length' <<< "$response")"
    if [ "$count" -eq 0 ]; then
      result="⚪ 尚无记录"
      created="—"
      title="—"
      run_url=""
    else
      status="$(jq -r '.workflow_runs[0].status // "unknown"' <<< "$response")"
      conclusion="$(jq -r '.workflow_runs[0].conclusion // empty' <<< "$response")"
      created="$(jq -r '.workflow_runs[0].created_at // "—"' <<< "$response")"
      run_url="$(jq -r '.workflow_runs[0].html_url // ""' <<< "$response")"
      title="$(jq -r '.workflow_runs[0].display_title // "—"' <<< "$response" | tr '|' '/')"
      if [ "$status" = "completed" ]; then
        case "$conclusion" in
          success) result="✅ 成功" ;;
          failure) result="❌ 失败" ;;
          cancelled) result="⚪ 已取消" ;;
          skipped) result="⚪ 已跳过" ;;
          *) result="⚪ $conclusion" ;;
        esac
      else
        result="🟡 运行中（$status）"
      fi
    fi
  else
    result="⚠️ 查询失败（API暂不可用）"
    created="—"
    title="—"
  fi
  printf '| %s | [打开网站](https://%s.pages.dev) | %s | %s | %s |\n' \
    "$derivative_repo" "$pages_project" "$title" "$result" "$created" >> "$summary"
done < <(jq -c '.[] | if type == "string" then {repository: ., pages_project: (split("/")[-1] | ascii_downcase)} else {repository: .repository, pages_project: (.pages_project // (.repository | split("/")[-1] | ascii_downcase))} end' <<< "$derivatives_json")

{
  echo
  echo "## 衍生站登记情况"
  echo
  echo "- 已登记衍生仓库：**$derivative_count** 个"
  echo "- 衍生站部署状态逐站读取各自公开仓库的 GitHub Actions 记录；查询失败会单独标记，不会误报为成功。"
  echo "- 衍生仓库同步成功不等于每个站点部署成功，请以逐站部署状态为准。"
  echo
  echo "## 说明"
  echo
  echo "- 时间按 GitHub Actions 返回的 UTC 时间记录。"
  echo "- “最近一次运行”表示对应工作流最近一次针对 main 分支的运行，不代表过去一段时间内每次运行都成功。"
  echo "- 衍生仓库的运行记录通过 GitHub 公共 API 读取；每次生成报告最多查询10个衍生仓库的公开运行记录，不需要新增密钥。"
  echo "- 如出现失败，请打开对应运行记录查看具体步骤和错误日志。"
} >> "$summary"

cat "$summary"
