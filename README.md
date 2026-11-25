# Türkiye Lifestyle

A Turkish-language consumer lifestyle and local-interest editorial website for readers in Türkiye.

> Project status: **Planning / foundation stage**. No production collection or automatic publishing is active yet.

## Editorial focus

The site focuses on consumer and lifestyle news, trends, guides, and useful local information, especially:

- **Moda** — fashion, clothing, style, and seasonal trends
- **Güzellik** — skincare, cosmetics, fragrance, and beauty
- **Yeme-İçme** — food, restaurants, Turkish cuisine, recipes, and dining trends
- **Sağlık** — evidence-based health, nutrition, sleep, and wellbeing
- **Spor** — sports, fitness, and major local sporting developments
- **Alışveriş** — shopping, products, brands, and consumer guidance
- **Teknoloji** — consumer technology and devices
- **Seyahat** — travel, holidays, and local destinations
- **Yaşam** — home, family, and everyday lifestyle
- **Kültür-Sanat** — culture, entertainment, and events

The website is an original editorial publication, not a full-text news-republication or RSS-mirroring service.

## Editorial and source principles

- Create original Turkish-language articles, explainers, trend reports, guides, and summaries.
- Prefer official announcements, clearly licensed open data, public research, event information, and other sources whose terms permit the intended use.
- Publicly accessible does not automatically mean reusable. Check the applicable terms, license, attribution, automated-access rules, and commercial-use conditions for each source.
- Do not copy full articles, protected photographs, videos, or other copyrighted material without permission.
- Attribute factual sources and link to the original material where appropriate.
- Health content must rely on credible evidence, distinguish general information from medical advice, and avoid diagnosis or unsupported treatment claims.
- Sports scores, schedules, and statistics must come from sources that permit the intended reuse; do not invent results.
- No production collection workflow until source rules, editorial checks, secrets, and deployment are reviewed.

## Planned architecture

`Permitted public information / licensed data → GitHub Actions → validation / deduplication / editorial processing → Markdown + JSON in Git → Astro static build → Cloudflare Pages`

The initial design uses repository files as the content store rather than a database. See:

- [Architecture](docs/ARCHITECTURE.md)
- [Source and rights policy](docs/NEWS-SOURCES.md)
- [Roadmap](docs/ROADMAP.md)

## Project constraints

- Content discovery and scanning target: **every 30 minutes** once approved automation is enabled; this is not a promise that every source updates on that schedule.
- No database in the initial version.
- No registration, login, user profiles, or member features.
- Prefer GitHub and Cloudflare free tiers. No paid service or AI API is enabled without explicit approval.
- GitHub Actions schedules are best-effort and may start later than the scheduled time.

## Development approach

Work in small phases. Each phase must be tested and reviewed before proceeding. Secrets such as API keys and Cloudflare tokens must be stored in GitHub Actions Secrets, never committed to this repository.

## Language

The public website is primarily for readers in Türkiye and will use Turkish (`tr`). Project documentation is maintained in Chinese for the project owner.
