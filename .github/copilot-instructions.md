<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

Project context:

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Target platform: Vercel

Guidelines:

- Prefer App Router patterns (server components by default, client components marked with 'use client')
- Use Tailwind utility classes for styling
- Keep components small and accessible (semantic HTML, focus states)
- Use edge-friendly APIs and fetch caching where possible
- Avoid client secrets in the browser; read secrets from process.env on the server
