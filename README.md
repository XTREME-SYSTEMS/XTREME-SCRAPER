# XTREME SCRAPER v2

Level 5 intelligence search — any industry, any city. **US & Canada.**

## Features
- **Source Selector** — toggle Google Maps, BBB, Apollo, Firecrawl, Yellow Pages, Yelp independently
- **🇺🇸 US + 🇨🇦 Canada** — all 50 US states + 13 Canadian provinces & territories
- Mode selector: Quick / Deep / Max / Level 5
- Limit selector: 50 / 100 / 200 / 500 / All
- AI intelligence summary per search
- Source breakdown pills on results

## Stack
- Next.js 15 / React 19 / TypeScript
- Zero external UI dependencies
- Inline styles only (no Tailwind, no CSS modules)

## Deploy to Vercel
1. Fork or push to GitHub
2. Import in Vercel — auto-detected as Next.js
3. Add environment variables (see `.env.example`)
4. Deploy

## Env Vars
See `.env.example` for required keys. The app proxies search requests to the backend — you can point `BACKEND_SEARCH_URL` / `BACKEND_SCRAPE_URL` to your own scrapers.

## Repo
`github.com/XTREME-SYSTEMS/XTREME-SCRAPER`
