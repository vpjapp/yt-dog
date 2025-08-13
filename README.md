# YT Dog

A Next.js 14+ (App Router) TypeScript app with Tailwind CSS that lets you:

- Enter multiple YouTube channel URLs (@handle or /channel/ID)
- List your saved channels
- Fetch all videos for a channel via the YouTube Data API
- Watch videos in-app and mark them as watched or skip
- Track watched/skipped in localStorage and suggest newest unwatched videos

## Getting Started

1. Create a YouTube Data API key and set it as an env var:

```bash
# .env.local (not committed)
YT_API_KEY=YOUR_API_KEY
```

2. Install dependencies and run dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy on Vercel

- Add environment variable `YT_API_KEY` in your Vercel Project Settings.
- Push to Git and import the repo in Vercel.

## Notes

- No server-side database. Watched/skipped state is stored in `localStorage`.
- API routes call YouTube Data API server-side using `process.env.YT_API_KEY`.
