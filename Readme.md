# FreeDrop

Never miss a free PC game again. FreeDrop tracks limited-time giveaways on Epic Games Store, Steam, GOG, itch.io and more, shows how long each one lasts, and links you straight to the store's own page to claim it.

**Live demo:** [add URL after deploying]  
**Status:** In development

![FreeDrop screenshot](docs/screenshot.png)

## Features

- [x] Aggregates free games from multiple stores into one feed
- [x] Shows regular price, store and time left for each giveaway
- [x] "Claim" button redirects to the store's own page
- [ ] "Was free before" history for every game
- [ ] Alerts via Telegram / Discord for new giveaways
- [ ] Browser push notifications
- [ ] Filters by store and "ending soon"

(Tick boxes as you finish them. Keep this list honest.)

## How it works

```
cron (every 1-3h)
   |
   +--> Epic Games API ----+
   |                       +--> normalize --> PostgreSQL --> new? --> notify
   +--> IsThereAnyDeal ----+                       |
                                                  v
                              React frontend <-- GET /api/free-games
```

1. A scheduled job fetches current free games from each source.
2. Each response is normalized into one common shape: `title, store, coverImage, dealUrl, regularPrice, currency, startsAt, expiresAt`.
3. Results are upserted into PostgreSQL. A promotion not seen before counts as new and triggers notifications.
4. The frontend only reads from this project's own API, never from the stores directly.

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express, node-cron |
| Database | PostgreSQL (`pg`) |
| Frontend | React, Vite, Tailwind CSS v4 |
| Notifications | Web Push, Telegram / Discord |
| Data sources | Epic Games Store (unofficial JSON endpoint), IsThereAnyDeal API |

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL (local, or a free hosted one such as Neon or Supabase)
- An IsThereAnyDeal API key (free, from https://isthereanydeal.com/apps/my)