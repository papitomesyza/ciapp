# year28 Macros

A focused personal nutrition tracker. Single user, installable to your phone's home screen.

## Stack

- **Backend:** Node.js + Express, [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for storage
- **Frontend:** React + Vite, [recharts](https://recharts.org/) for charts, [lucide-react](https://lucide.dev/) for icons
- **PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — installable, offline app shell
- In production, one Express process serves the built frontend and the `/api` routes on port 3000.

## Local development

```bash
npm install
cp .env.example .env
# edit .env — set APP_PASSPHRASE, SESSION_SECRET, and ANTHROPIC_API_KEY (for AI logging)
```

For local dev, point the SQLite file somewhere writable outside the container path by adding to `.env`:

```
DATA_DIR=./data
```

Then run the dev server (Vite frontend on :5173, Express API on :3000, proxied):

```bash
npm run dev
```

Open http://localhost:5173 and log in with your `APP_PASSPHRASE`.

## Production build

```bash
npm run build   # builds the frontend into dist/
npm start       # runs Express, serving dist/ + /api on port 3000
```

## Environment variables

| Variable | Purpose |
|---|---|
| `APP_PASSPHRASE` | The single-user login passphrase. Hashed into the database on first boot. Change it later from Settings. |
| `SESSION_SECRET` | Secret used to sign session tokens. Set this to a long random string. |
| `ANTHROPIC_API_KEY` | Enables AI text logging ("2 eggs, coffee with milk, banana"). Without it, the AI tab returns an error but the rest of the app works. |
| `PORT` | Defaults to `3000`. |
| `DATA_DIR` | Where the SQLite file lives. Defaults to `/app/data` (matches the Zeabur volume mount). |

## Deploying to Zeabur

1. Push this repo to GitHub.
2. In Zeabur, create a new service from the repo using the **Docker** provider — it will build from the included `Dockerfile`.
3. Attach a persistent volume mounted at `/app/data`.
4. Set the environment variables above (`APP_PASSPHRASE`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`).
5. Deploy. The app boots fine against an empty volume — it creates the SQLite file and seeds default targets on first run.

## Data model notes

- **Log entries** store a frozen snapshot of calories/protein/carbs/fat/fiber/sugar/sodium/saturated fat for the amount eaten — never a live reference to a food. Editing a custom food or re-searching later does not change past entries.
- **Custom foods** store macros per serving, for local products Open Food Facts doesn't have.
- **Favorites** store a per-basis-amount macro snapshot (per 100g for Open Food Facts foods, per serving for custom foods) so the amount can still be adjusted at log time.

---

a year28 development
