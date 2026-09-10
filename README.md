# Note Flashcards

A mobile-friendly web app for practicing note reading on the musical staff. Each card shows a note on a grand staff (treble and bass clefs) and asks you to identify it from three choices.

## How it works

- A random natural note is drawn on either the treble or bass staff.
- Three letter choices (A–G) are shown at the bottom.
- **Correct:** a confetti burst fires and the next card loads immediately.
- **Wrong:** the tapped choice is shaded red and disabled, and you keep guessing until you get it right.

Note ranges:

- Treble clef: C4–A5
- Bass clef: C2–C4

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [VexFlow](https://vexflow.com/) for music notation rendering
- [canvas-confetti](https://github.com/catdad/canvas-confetti) for the reward animation
- [devbox](https://www.jetify.com/devbox) for the pinned Node.js toolchain

## Getting started

The project uses devbox to provide Node.js. If you have devbox installed:

```bash
devbox install
devbox run -- npm install
devbox run -- npm run dev -- --host
```

Then open the printed local URL. Passing `--host` exposes the dev server on your LAN for testing from a phone.

If you already have a suitable Node.js (22+) installed, you can skip devbox and run `npm install` / `npm run dev` directly.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run the TypeScript compiler with no emit |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run cf-preview` | Build and preview the Worker locally |

## Deployment

The app is hosted on Cloudflare Workers as an assets-only site (no Worker script), so requests to static assets are free and unlimited. Configuration lives in `wrangler.jsonc`:

- `assets.directory` points at the Vite build output (`./dist`).
- `assets.not_found_handling = "single-page-application"` serves `index.html` for unknown navigation requests.
- `routes` binds the `flashcards.gdw2.com` custom domain.

To deploy manually:

```bash
devbox run -- npm install
devbox run -- npx wrangler login   # one-time, opens a browser
devbox run -- npm run deploy
```

The site is then available at https://flashcards.gdw2.com (and at the `*.workers.dev` URL). `wrangler login` stores credentials in your user config; subsequent deploys only need `npm run deploy`.

## Project structure

```
src/
  App.tsx                     # Game loop, state, confetti trigger
  components/
    Staff.tsx                 # Renders the grand staff and note with VexFlow
    AnswerButtons.tsx         # The three tappable choices
  lib/
    notes.ts                  # Note pools, question generation, helpers
  index.css                   # Global styles
  App.css                     # App layout and component styles
```

### Staff rendering notes

VexFlow renders into an SVG at a fixed canvas size. The component then sets a tight `viewBox` around the clef and note so the notation scales up to fill the card, letting the staff lines run off the edges. `Stave(x, y, ...)` positions the top of the bounding box including `spaceAboveStaffLn` headroom, so the crop is centered on the actual line positions via `getYForLine`.
