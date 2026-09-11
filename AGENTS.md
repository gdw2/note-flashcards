# AGENTS.md

Context for working on this repo in a new session. Keep this file up to date when architecture, deployment, or workflows change.

## What this is

A mobile-friendly web game for practicing note reading. The player enters a name, then has 60 seconds to name as many notes as possible. Correct answers fire confetti and advance; wrong answers turn red and the player retries. When time runs out, the score (and accuracy) is submitted to a global leaderboard.

## Stack

- Vite + React + TypeScript (strict)
- VexFlow 5 for staff notation
- canvas-confetti for the reward animation
- Cloudflare Workers (API + static assets) and D1 (SQLite) for the leaderboard
- devbox pins Node 22; npm manages project dependencies

## Repo & infrastructure facts

- GitHub: `gdw2/note-flashcards` (public), branch `main`
- Live: https://flashcards.gdw2.com
- Cloudflare account ID: `7d96a4490eeee1b7f818f97db3d3e51d` (gdwarner@gmail.com)
- Worker name: `note-flashcards`
- D1 database: `note-flashcards`, id `8f45bbe6-4735-4d94-9814-1925c2be66da`, region WNAM
- Zone: `gdw2.com`. A `*.gdw2.com` CNAME points at a Cloudflare Tunnel; the Worker's custom domain record for `flashcards.gdw2.com` overrides the wildcard. Other subdomains still use the tunnel.
- GitHub secret scanning + push protection are enabled. Never commit credentials. Wrangler's OAuth token lives at `~/.config/.wrangler/config/default.toml` (outside the repo).

## Commands

All commands go through devbox:

```bash
devbox run -- npm install
devbox run -- npm run dev          # Vite dev server, UI only (no /api)
devbox run -- npm run typecheck    # tsc -b across app, node, and worker projects
devbox run -- npm run build        # type-check + vite build to dist/
devbox run -- npm run cf-preview   # build + run Worker with local D1 (full stack)
devbox run -- npm run deploy       # build + wrangler deploy
```

Local full-stack (the Vite dev server does **not** serve `/api`):

```bash
devbox run -- npx wrangler d1 migrations apply note-flashcards --local
devbox run -- npm run cf-preview
```

## Deployment

Manual deploy (the chosen workflow; no CI):

```bash
devbox run -- npx wrangler login                                       # one-time, OAuth via browser
devbox run -- npx wrangler d1 migrations apply note-flashcards --remote
devbox run -- npm run deploy
```

`wrangler.jsonc` is the source of truth: `main` = `worker/index.ts`, `assets.directory` = `./dist` with `not_found_handling: single-page-application`, `assets.run_worker_first: ["/api/*"]`, the D1 binding, and the custom-domain route.

When running non-interactively (or from an agent), prefix with `CI=1 WRANGLER_SEND_METRICS=false` so prompts auto-confirm.

## Architecture

```
worker/index.ts            API Worker: GET /api/leaderboard, POST /api/scores; falls through to ASSETS
migrations/*.sql           D1 schema migrations (apply in order)
src/App.tsx                Screen state machine ('home' | 'playing' | 'results'), 60s timer, score/attempts, submit
src/components/            HomeScreen, GameScreen, ResultsScreen, TimeBar, Leaderboard, Staff, AnswerButtons
src/lib/notes.ts           Note pools + question generation
src/lib/api.ts             Leaderboard API client
src/lib/time.ts            Relative time formatting
```

TypeScript uses project references: `tsconfig.app.json` (src, DOM), `tsconfig.node.json` (vite config), `worker/tsconfig.json` (`@cloudflare/workers-types`, no DOM). `tsc -b` builds all three.

## API & data

`GET /api/leaderboard` → top 10: `{ leaderboard: [{ name, score, accuracy, created_at }] }`, ordered by score desc, then oldest first.

`POST /api/scores` body `{ name, score, accuracy }`:
- `name`: trimmed, max 20 chars, control chars stripped
- `score`: integer 0–500
- `accuracy`: integer 0–100, or null/omitted (legacy rows)
- Returns the updated leaderboard (201).

`created_at` is SQLite `datetime('now')` → UTC, format `YYYY-MM-DD HH:MM:SS`. The frontend parses it as UTC (`src/lib/time.ts`).

Accuracy = `correct / attempts` (rounded). The client tracks `attempts` (every tap) and `score` (correct). Values are **client-reported and not server-validated** — fine for casual play.

Leaderboard display: relative time under the name; accuracy under the score in grey. `accuracy === null` renders as `100%`.

## Gotchas

- **VexFlow `Stave(x, y, w)`**: `y` is the top of the bounding box *including* `spaceAboveStaffLn` (4 spaces = 40px) headroom, so the actual top staff line is `y + 40`. The crop in `Staff.tsx` centers on `getYForLine()` values, not the passed `y`.
- **`pkill -f "pattern"` hangs**: the invoking shell's own command line contains the pattern, so pkill kills its parent shell and the tool waits until timeout. Use the bracket trick: `pkill -f '[w]rangler dev'`.
- **Vite dev server has no API**; use `npm run cf-preview` for full-stack local testing.
- **`wrangler d1 execute` can intermittently fail** with account error 7403; retrying usually works.
- **`npm audit`** reports high-severity advisories in `sharp` (transitive via `wrangler`/`miniflare`, dev-only). Do not `npm audit fix --force`; it downgrades Wrangler.
- Keep `worker/index.ts` free of DOM APIs (it is type-checked without DOM libs).

## Conventions

- No code comments unless necessary.
- Match existing formatting (2-space indent, single quotes, no semicolons).
- Run `npm run typecheck` before considering work done.
