# Türkiye News

An automated, Turkish-language news aggregation and editorial publishing platform.

> Project status: **Planning / foundation stage**. No news collection or automatic publishing is active yet.

## Principles

- Scan configured news feeds every **30 minutes** once collection is enabled.
- Prefer official RSS feeds, public APIs, and explicitly authorized sources.
- Publish original Turkish summaries and metadata; do not republish full source articles or images without permission.
- Cross-check important stories; require human review for major or sensitive stories.
- Keep the public website static. No visitor accounts, registration, memberships, or database-backed user features.
- Prefer GitHub and Cloudflare free tiers. No paid service is enabled without explicit approval.

## Planned architecture

`Approved news feeds → GitHub Actions → validation / deduplication / editorial processing → Markdown + JSON in Git → Astro static build → Cloudflare Pages`

The initial design uses repository files as the content store rather than a database. See:

- [Architecture](docs/ARCHITECTURE.md)
- [News source policy](docs/NEWS-SOURCES.md)
- [Roadmap](docs/ROADMAP.md)

## Important constraints

- Collection cadence: **30 minutes**, not more frequent.
- No database in the initial version.
- No registration, login, user profiles, or member features.
- No production collection workflow until source access, editorial rules, secrets, and deployment are reviewed.
- GitHub Actions schedules are best-effort and may start later than the scheduled time.

## Development approach

Work in small phases. Each phase must be tested and reviewed before proceeding. Secrets such as API keys and Cloudflare tokens must be stored in GitHub Actions Secrets, never committed to this repository.

## Language

The published website is intended primarily for readers in Türkiye and will use Turkish (`tr`) for public-facing content. Project documentation is currently maintained in Chinese for the project owner.
