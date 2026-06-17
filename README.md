# WC2026.my — FIFA World Cup 2026 Live Tracker

A real-time FIFA World Cup 2026 tracking web application built with React, TypeScript, and Supabase.

## Live Site
**[wc2026.my](https://wc2026.my)**

## What it does
- Live match scores and standings updated in real time
- Full schedule for all 104 matches with Baku timezone support
- Group standings with W/D/L tracking
- Match details — commentary, lineups, and stats
- Tournament Predictor — pick your winners from Group Stage all the way to the Final
- AI win probability for every match

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase Edge Functions (serverless proxy)
- **API:** RapidAPI World Cup 2026 Live API
- **Deployment:** Vercel with custom domain

## Architecture
The app uses a Supabase Edge Function as a proxy between the frontend and RapidAPI. This hides the API key from the client and allows rate limiting — when the API returns 429, the app serves cached data from localStorage and retries after 2 minutes.

## Challenges I solved
- **Rate limiting** — built a smart caching system that serves stale data during API backoff periods
- **Timezone conversion** — converted all match times from ET to Baku time (UTC+4)
- **Data parsing** — the API returns inconsistent JSON formats depending on match status; wrote a robust normalizer that handles all edge cases
- **Deployment pipeline** — set up GitHub → Vercel CI/CD so every push auto-deploys

## What I learned
- How to build and deploy serverless functions
- Working with real production APIs and handling failures gracefully
- TypeScript type safety in a complex data pipeline
- CI/CD with GitHub and Vercel
