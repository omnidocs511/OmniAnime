# Zenshin — Anime Tracker & Discovery

A modern, dark-themed anime tracking and discovery platform built with React + TypeScript + Vite (frontend) and Python + FastAPI (backend).

![Zenshin](https://img.shields.io/badge/Zenshin-Anime%20Tracker-8b5cf6?style=for-the-badge)

## 🎯 Features

- **Hero Banner**: Rotating carousel of trending anime with metadata overlays
- **Top Airing / Trending / Seasonal**: Horizontal scrollable card sections
- **Anime Detail Page**: Full metadata, synopsis, episode list, relations, recommendations
- **Global Search**: Ctrl+K shortcut, debounced autocomplete, keyboard navigation
- **Dark Theme**: Deep blacks, purples, neon accents matching the Zenshin aesthetic
- **Smooth Animations**: Framer Motion transitions, hover effects, loading skeletons
- **Responsive**: Mobile-first Tailwind CSS design

## 🏗️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v4
- Framer Motion (animations)
- TanStack React Query (data fetching/caching)
- React Router v6
- Lucide React (icons)
- React Helmet Async (SEO)

### Backend
- Python 3.11+
- FastAPI + Uvicorn
- httpx (async HTTP)
- cachetools (in-memory TTL cache)

### Data Sources
- **Primary**: AniList GraphQL API
- **Fallback**: Jikan v4 (MyAnimeList)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- pip

### Backend Setup

```bash
cd backend

# Install dependencies (use the full Python 3.12 path if `python` isn't mapped)
"C:\Users\WELCOME\AppData\Local\Programs\Python\Python312\python.exe" -m pip install -r requirements.txt

# Start the server (Option A: full path)
"C:\Users\WELCOME\AppData\Local\Programs\Python\Python312\python.exe" main.py

# Start the server (Option B: use the convenience script)
start.bat
```

The API will start at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will start at `http://localhost:5173`.

> The Vite dev server proxies `/api` requests to `http://localhost:8000` automatically.

## 📁 Project Structure

```
OmniAnime/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── anilist.py            # AniList GraphQL client + cache
│   ├── jikan.py              # Jikan v4 fallback client
│   ├── .env                  # Backend env vars
│   ├── requirements.txt
│   └── routers/
│       ├── anime.py          # /api/anime, /api/trending, etc.
│       └── search.py         # /api/search
├── frontend/
│   ├── src/
│   │   ├── api/client.ts     # Axios API client
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── SearchModal.tsx
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── AnimeCard.tsx
│   │   │   ├── AnimeGrid.tsx
│   │   │   ├── EpisodeList.tsx
│   │   │   ├── Skeletons.tsx
│   │   │   └── Footer.tsx
│   │   ├── hooks/useAnime.ts
│   │   ├── lib/
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   └── AnimeDetailPage.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/trending` | Trending anime |
| `GET /api/top-airing` | Currently airing popular anime |
| `GET /api/season` | Seasonal anime (auto-detects current) |
| `GET /api/popular` | All-time popular anime |
| `GET /api/anime/:id` | Full anime details |
| `GET /api/episodes/:id` | Episode list for an anime |
| `GET /api/search?q=...` | Search anime by title |

## 📝 License

MIT
