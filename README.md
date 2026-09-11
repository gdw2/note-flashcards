# Note Flashcards

A mobile-friendly web game for practicing note reading on the musical staff. Name as many notes as you can in 60 seconds and post your score to a global leaderboard.

## How to play

1. Enter a name on the home screen and press **Go**.
2. A random natural note is drawn on a grand staff (treble or bass clef) with three letter choices (A–G).
3. **Correct:** a confetti burst fires, your score increases, and the next note appears immediately.
4. **Wrong:** the tapped choice is shaded red and disabled, and you keep guessing until you get it right.
5. A thin bar at the bottom of the screen shows the time remaining. When it runs out, your score is submitted to the global leaderboard.

Note ranges:

- Treble clef: C4–A5
- Bass clef: C2–C4

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [VexFlow](https://vexflow.com/) for music notation rendering
- [canvas-confetti](https://github.com/catdad/canvas-confetti) for the reward animation
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [D1](https://developers.cloudflare.com/d1/) for the API and leaderboard
- [devbox](https://www.jetify.com/devbox) for the pinned Node.js toolchain

## Getting started

The project uses devbox to provide Node.js. If you have devbox installed:

```bash
devbox install
devbox run -- npm install
devbox run -- npm run dev -- --host
```

Then open the printed local URL. Passing `--host` exposes the dev server on your LAN for testing from a phone.

> The plain Vite dev server does not serve the `/api/*` routes, so the leaderboard will not load. For a full-stack local run, use `npm run cf-preview` (see below).

If you already have a suitable Node.js (22+) installed, you can skip devbox and run `npm install` / `npm run dev` directly.

### Full-stack local development

`cf-preview` builds the app and runs it through Wrangler with local D1 and asset bindings:

```bash
devbox run -- npx wrangler d1 migrations apply note-flashcards --local
devbox run -- npm run cf-preview
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (UI only) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run the TypeScript compiler with no emit |
| `npm run cf-preview` | Build and run the full app (Worker + assets) locally |
| `npm run deploy` | Build and deploy to Cloudflare Workers |

## Backend

The Worker in `worker/index.ts` serves the SPA assets and exposes a small JSON API:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/leaderboard` | Top 10 scores, highest first |
| `POST` | `/api/scores` | Submit `{ name, score, accuracy }`, returns the updated leaderboard |

Scores are stored in a D1 (SQLite) database. The schema lives in `migrations/`:

```sql
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  accuracy INTEGER,                                  -- added in 0002; null for legacy rows
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Accuracy is the percentage of taps that were correct (`correct / attempts`). Rows without a recorded accuracy are displayed as `100%`.

Input is validated server-side (name trimmed to 20 characters, score an integer between 0 and 500, accuracy an integer between 0 and 100 or omitted). Note that the score and accuracy are reported by the client, so this is suitable for casual play rather than competitive integrity.

Apply migrations:

```bash
devbox run -- npx wrangler d1 migrations apply note-flashcards --local    # local
devbox run -- npx wrangler d1 migrations apply note-flashcards --remote   # production
```

## Deployment

The app is hosted on Cloudflare Workers with a D1 binding. Configuration lives in `wrangler.jsonc`:

- `main` points at the Worker script (`worker/index.ts`).
- `assets.directory` points at the Vite build output (`./dist`), with `not_found_handling = "single-page-application"` for SPA fallback.
- `assets.run_worker_first = ["/api/*"]` routes API calls to the Worker; everything else is served as a static asset.
- `d1_databases` binds the `note-flashcards` database.
- `routes` binds the `flashcards.gdw2.com` custom domain.

To deploy manually:

```bash
devbox run -- npm install
devbox run -- npx wrangler login                                    # one-time, opens a browser
devbox run -- npx wrangler d1 migrations apply note-flashcards --remote
devbox run -- npm run deploy
```

The site is then available at https://flashcards.gdw2.com. `wrangler login` stores credentials in your user config; subsequent deploys only need the migration and deploy commands.

## Project structure

```
worker/
  index.ts                    # API Worker (leaderboard endpoints)
migrations/
  0001_create_scores.sql      # D1 schema
src/
  App.tsx                     # Screen state machine, timer, score, confetti
  components/
    HomeScreen.tsx            # Title, name input, Go button, leaderboard
    GameScreen.tsx            # Score header, staff, answer choices
    ResultsScreen.tsx         # Final score, leaderboard, play again
    TimeBar.tsx               # Thin time-remaining progress bar
    Leaderboard.tsx           # Ranked score list
    Staff.tsx                 # Renders the grand staff and note with VexFlow
    AnswerButtons.tsx         # The three tappable choices
  lib/
    notes.ts                  # Note pools, question generation, helpers
    api.ts                    # Leaderboard API client
    time.ts                   # Relative time formatting
  index.css                   # Global styles
  App.css                     # App layout and component styles
```

### Staff rendering notes

VexFlow renders into an SVG at a fixed canvas size. The component then sets a tight `viewBox` around the clef and note so the notation scales up to fill the card, letting the staff lines run off the edges. `Stave(x, y, ...)` positions the top of the bounding box including `spaceAboveStaffLn` headroom, so the crop is centered on the actual line positions via `getYForLine`.
