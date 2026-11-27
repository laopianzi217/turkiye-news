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
  local response count status conclusion created url title
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

derivative_count="$(gh api "repos/$repo/contents/data/derivatives.json" --jq '.content' | tr -d '\n' | base64 -d | jq 'length')"
{
  echo
  echo "## 衍生站登记情况"
  echo
  echo "- 已登记衍生仓库：**$derivative_count** 个"
  echo "- 最近一次衍生仓库同步结果见上表；网站可用性巡检会检查主站及全部登记衍生站。"
  echo "- 本报告不逐站触发部署，也不将“同步成功”误认为“每个站点部署成功”。"
  echo
  echo "## 说明"
  echo
  echo "- 时间按 GitHub Actions 返回的 UTC 时间记录。"
  echo "- “最近一次运行”表示对应工作流最近一次针对 main 分支的运行，不代表过去一段时间内每次运行都成功。"
  echo "- 如出现失败，请打开对应运行记录查看具体步骤和错误日志。"
} >> "$summary"

cat "$summary"
