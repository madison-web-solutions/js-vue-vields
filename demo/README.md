# vue-fields-ms Demo

A local development app for testing the vue-fields-ms component library. It simulates a realistic CMS environment with a mock backend — no real database or external services required.

## Running the demo

```bash
npm run dev
```

Open http://localhost:5173 in your browser. Two tabs are available:

- **Article Form** — a realistic form covering most field types, backed by the mock server (load, edit, save, validate)
- **All Fields** — one of every field type in isolation, useful for quick visual checks

## Mock backend

The Vite dev server runs a mock API at `/api/*` that handles form persistence, media upload/replace/delete, choices, and link search. Data is stored in `demo/data/` (gitignored).

All four library providers are wired up:

| Provider | What it does in the demo |
|---|---|
| `choicesProvider` | Serves static lists (statuses, categories) from the mock server |
| `linksProvider` | Searches mock pages and posts by scheme (`page`, `post`, `url`) |
| `mediaProvider` | Full upload/replace/delete with server-side thumbnail generation via `sharp` |
| `passwordStrengthProvider` | Pure JS heuristic (length, case, digits, symbols) |

## Seed data

On first run (when `demo/data/` does not exist), the mock server seeds the demo automatically:

1. Source files from `demo/initial-data/uploads/` are copied to `demo/data/uploads/`
2. A 300px-wide thumbnail is generated for each raster image (PNG/JPG/WebP) using `sharp`
3. `demo/data/db.json` is created with 50 media items (the source files repeated 5×) and a pre-populated Article record

Alt text for seed images is read from `demo/initial-data/alt-text.json`. Files not listed there get `alt: null`, which is intentional — in real use, users often skip alt text.

## Resetting the demo

```bash
npm run demo:reset
```

This deletes `demo/data/` entirely. The next `npm run dev` will reseed from scratch.

## Adding seed images

Drop image files into `demo/initial-data/uploads/` and optionally add an entry to `demo/initial-data/alt-text.json`. Then run `npm run demo:reset` and restart the dev server. Titles are derived automatically from filenames (`desk-laptop.png` → "Desk Laptop").

Keep source files reasonably sized — they are committed to git and copied (not moved) during seeding.
