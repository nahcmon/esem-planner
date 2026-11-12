# ESEM Planner

A local-first study planner for the B.Sc. **Energy Systems Engineering and Management (ESEM)** at Heilbronn University, Campus Künzelsau. It runs entirely in the browser — no account, no backend, no database, no tracking.

**Live app:** https://esem-planner.vercel.app

## Features

- **Today** — next session, daily timeline, open tasks, focus topics.
- **Week** — week grid and agenda views, filters, moved/cancelled sessions, quick rescheduling.
- **Modules** — all 7 semesters and 32 modules with ECTS, courses, topics, notes, literature and exam links.
- **Progress** — overall and semester ECTS, study-time goals, streak, 8-week chart, per-course progress and priority-sorted open topics.
- **Exams** — countdown, registration/withdrawal windows, editable dates, statuses, grades and per-exam checklists.
- **Settings** — German/English, current semester, weekly/daily goals, data transfer, PWA install, sources.
- **Local-first** — every entry is stored in `localStorage` (`esem-planner:v1`).
- **Cross-device transfer** — full/compact share link, QR progress snapshot, URL/code import, JSON export/import with merge or replace.
- **PWA** — installable, lightweight custom service worker for offline use.
- **Dark only** — a dense graphite interface with a lime accent, built for phones and desktops.

## Privacy

There is no server component. Tasks, notes, exam checklists and settings stay in the browser.

Share links keep the complete state in the URL fragment (`#share=…`). URL fragments are never sent to Vercel or any third party. QR codes contain a reduced progress snapshot without free-text notes. Only share a link with people you trust — anyone who has it can read the embedded data.

## Curriculum and disclaimer

The curriculum data is based on public programme documents:

- **SPO 01 ESEM** (29 January 2025)
- **ESEM module handbook** (8 September 2025)
- **HHN academic calendar WS 2026/27** — lecture period 28 Sep 2026 – 22 Jan 2027, exam period 28 Jan – 18 Feb 2027, exam registration 26 Oct – 6 Nov 2026, withdrawal from 30 Nov 2026.

Exact exam dates are published on **22 December 2026**, so they start empty and are editable. Weekly course times are not published as structured data; the starter schedule is a realistic, fully editable example. The Spanish slot is fixed to **Wednesday 15:30–17:00**, and online Physics is marked as frequently rescheduled.

This is an unofficial student project and is not affiliated with Hochschule Heilbronn. Always verify deadlines, rooms and exam dates in StarPlan and official programme documents.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand · React Router · date-fns · lucide-react · lz-string · qrcode

## Development

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest
npm run build      # typecheck + production build
npm run preview    # serve the production build
```

## Deploy to Vercel

Import the repository in Vercel. Vercel detects Vite automatically; the defaults are:

- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` adds SPA rewrites, long-term caching for hashed assets and no-cache headers for the service worker. No environment variables are required.

## Sharing model

- **Full link** — complete state including notes.
- **Compact link** — complete state without free-text notes.
- **QR code** — compact progress snapshot (settings, module/topic progress, completed tasks, custom tasks/topics, exam status, session changes). Seeded tasks and sessions are rebuilt from the starter state on the receiving device.
- **JSON** — backup of all local data, importable with merge or replace.

## License

[MIT](./LICENSE)
