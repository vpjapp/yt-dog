# YT-DOG

A Next.js app to track YouTube channels, fetch latest videos, and mark them as watched or skipped. Built with TypeScript, Tailwind CSS, and Zustand. Ready for Vercel.

## Env

- Server-only: `YT_API_KEY` (YouTube Data API v3). Do not prefix with NEXT_PUBLIC.

## Getting Started

1. Create `.env.local`

   ```
   YT_API_KEY=your_key_here
   ```

2. Run the dev server

   ```
   npm run dev
   ```

Open http://localhost:3000.

## Features

- Add multiple channel URLs or @handles
- Persisted local storage (no backend DB)
- Show 10 newest unwatched videos and paginate by 10
- Mark watched or skipped
- Background refresh with subtle loading pulse
- Shows watched/total per channel on channels list
- Server-side API routes call YouTube with private key

## Deployment on Vercel

- Add Environment Variable `YT_API_KEY`
- Deploy

## Notes

- Orientation lock is best-effort and depends on browser/device.
