<div align="center">

# 🏆 Commity

### The Ultimate GitHub Contributor Analytics, Leaderboards & Developer Wrapped Platform

A high-performance open-source platform tracking, ranking, and celebrating GitHub developers worldwide. Built on the authoritative **committers.top weekly snapshot architecture** and **GitHub GraphQL 365-day contributionsCollection**, Commity provides zero-latency rankings, developer retrospectives, head-to-head duels, and embeddable README badges.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-enabled-blueviolet?style=for-the-badge&logo=vercel)](https://turbo.build/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Jest](https://img.shields.io/badge/Tests-19%20Passed-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Project Structure](#-project-structure) • [API Reference](#-api-reference) • [Architecture](#-architecture--ranking-engine)

---

</div>

## ✨ Features

### 🎁 2026 GitHub Developer Wrapped & Social Share Card (`/wrapped`)
- **Interactive Story Carousel**: Spotify/Instagram-style slide progression celebrating yearly developer impact with keyboard controls (`Space`, `←`, `→`, `P` to pause/play).
- **Algorithmic Developer Archetypes**: Evaluates commit volume, streak discipline, review/PR ratios, and language diversity to award verified developer personas:
  - 🔥 **The Streak Titan**: Unbreakable daily coding consistency and endurance.
  - 🏛️ **The Open Source Pillar**: Collaborative backbone driving community reviews and PRs.
  - 🌐 **The Polyglot Architect**: Seamlessly orchestrating across multi-language stacks.
  - ⚡ **Full-Stack Velocity Demon**: High-octane builder turning ideas into code at supersonic speed.
  - 🛠️ **The Code Craftsman**: Quiet, dependable craftsmanship focused on clean software.
- **1-Click High-Res PNG Social Card**: Pure client-side HTML5 Canvas generator rendering a crisp 1200×630 social card ready for social feeds with 0 server latency.
- **1-Click Social Sharing**: Direct sharing intents to **X (Twitter)** and **LinkedIn** with formatted statistics.
- **Universal User Switcher**: Generate Wrapped for any developer on GitHub (`torvalds`, `antfu`, `shadcn`, etc.).

---

### 🏆 Authoritative Leaderboard Engine (`/leaderboard`)
- **committers.top Architecture**: Pre-computes and caches weekly snapshots in MongoDB to guarantee **0ms page load times** without exhausting GitHub API rate limits (5,000 req/hr).
- **Official National & Global Standings**: Displays verified national ranks across categories:
  - `All`: Public + Private Contributions (`countryRankAll`)
  - `Contributions`: Public Contributions only (`countryRankPublic`)
  - `Commits`: Total Commits only (`countryRankCommits`)
- **Country & Ecosystem Scale**: Displays macroeconomic developer population metrics (e.g. 160,760+ developers in Pakistan, 1.9M+ in USA, 1.1M+ in India) and follower qualification thresholds (e.g. 69+ followers required for Pakistan Top 256).
- **Export Capabilities**: Export active leaderboard rankings in one click to **CSV** or **JSON**.

---

### 🔍 Deep Developer Profiles & Streak Studio (`/profile/[username]`)
- **Authentic GraphQL 365-Day Metrics**: Captures full contributionsCollection spectrum: commits, pull requests, code reviews, and issues.
- **Public vs. Private Contribution Breakdown**: Clear visual split between public repositories and restricted private contributions.
- **Streak Studio**: Live current streak, longest recorded continuous streak, and consistency score.
- **Dynamic Interactive Calendar**: Year-round commit activity map.
- **City Hubs & Location Normalization**: Intelligently groups city-level locations (e.g. Karachi, Lahore, Islamabad, Abbottabad) under national cohorts.
- **Live Sync Button**: On-demand one-click profile synchronization with the live GitHub GraphQL API.

---

### 🛡️ Dynamic Embeddable README Badges
- Copy and paste auto-updating SVG badges directly into your GitHub profile `README.md`:
  - **Rank Badge**: `GET /api/users/:username/badge.svg`
  ```markdown
  [![Commity Rank](https://your-commity-domain.com/api/users/octocat/badge.svg)](https://your-commity-domain.com/profile/octocat)
  ```
  - **Streak Badge**: `GET /api/users/:username/streak.svg`
  ```markdown
  [![Commity Streak](https://your-commity-domain.com/api/users/octocat/streak.svg)](https://your-commity-domain.com/profile/octocat)
  ```

---

### ⚔️ Head-to-Head Developer Duels & Analytics (`/analytics`)
- **1v1 Developer Battle Arena**: Compare any two GitHub developers side-by-side across contributions, active streaks, follower influence, repository counts, and tech stack diversity.
- **Instant Duel Report Generator**: Copy formatted battle summaries to clipboard with one click.
- **Spotlight Search (⌘K Command Palette)**: Quick keyboard-driven navigation across profiles, pages, and actions anywhere on the platform.
- **Persistent Theme Engine**: Smooth dark and light mode toggle.

---

## 🏗️ Project Structure

```
Commity/
├── backend/                        # Node.js + Express REST API
│   ├── src/
│   │   ├── config/                 # Database, constants, and cache configurations
│   │   ├── controllers/            # Route controllers
│   │   │   ├── analyticsController.js
│   │   │   ├── leaderboardController.js
│   │   │   ├── userController.js
│   │   │   └── wrappedController.js   # 2026 Developer Wrapped & Archetype Engine
│   │   ├── middleware/             # Validation, auth, rate limiting, error handling
│   │   ├── models/                 # MongoDB Mongoose schemas (User, Analytics, RankingSnapshot)
│   │   ├── routes/                 # API route declarations
│   │   │   ├── analytics.js
│   │   │   ├── leaderboard.js
│   │   │   └── users.js
│   │   ├── services/               # Business logic
│   │   │   ├── committersService.js   # committers.top weekly snapshot sync
│   │   │   ├── githubRankingService.js
│   │   │   ├── githubService.js       # Octokit REST & GraphQL client
│   │   │   ├── syncWorker.js          # Scheduled Monday cron jobs
│   │   │   └── userService.js
│   │   ├── utils/                  # Helper utilities, Winston logger, in-memory cache
│   │   └── index.js                # Express app entry point
│   ├── tests/                      # Jest API test suite (19 test cases)
│   ├── package.json
│   └── .env.example
│
├── frontend/                       # Next.js 15 (Turbopack + App Router)
│   ├── app/
│   │   ├── analytics/              # Multi-user comparison & analytics hub
│   │   ├── components/             # Reusable UI & specialized modules
│   │   │   ├── ui/                 # Avatar, Badge, Button, Card, Input, Loading
│   │   │   ├── CommandPalette.js   # ⌘K Global search palette
│   │   │   ├── Navigation.js       # Responsive navbar with Wrapped 🎁 badge
│   │   │   └── StreakStudio.js     # Streak tracking component
│   │   ├── dashboard/              # Developer dashboard
│   │   ├── leaderboard/            # Global & country rankings table with CSV/JSON export
│   │   ├── profile/                # Profiles directory & city maintainer hubs
│   │   │   └── [username]/         # Full user profile with verified GraphQL metrics
│   │   ├── wrapped/                # 2026 Developer Wrapped stories & Canvas PNG export
│   │   ├── layout.js               # Root layout & theme provider
│   │   ├── page.js                 # Home landing page with Duel arena & badge studio
│   │   └── globals.css             # Tailwind CSS & custom design tokens
│   ├── package.json
│   └── next.config.mjs
│
├── docker-compose.yml              # Multi-container orchestration
├── LICENSE                         # MIT License
└── README.md                       # Documentation
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18.0.0 or higher
- **MongoDB** (Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **GitHub Personal Access Token** ([Generate here](https://github.com/settings/tokens) with `read:user` and `repo` scopes)

---

### 1. Clone the Repository
```bash
git clone https://github.com/waleedcodes/Commity.git
cd Commity
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your credentials:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/commity
GITHUB_TOKEN=ghp_your_personal_access_token_here
FRONTEND_URL=http://localhost:3000
ENABLE_SCHEDULED_UPDATES=true
UPDATE_SCHEDULE=0 2 * * *
```

Start the backend server:
```bash
npm run dev
```
*Backend API will run at `http://localhost:5001/api` (Health check: `http://localhost:5001/health`)*

---

### 3. Frontend Setup

In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Set environment variable (optional, defaults to http://localhost:5001/api)
echo "NEXT_PUBLIC_API_URL=http://localhost:5001/api" > .env.local

# Start Next.js with Turbopack
npm run dev
```
*Frontend application will open at `http://localhost:3000`*

---

## 🧪 Testing & Verification

### Run Backend API Test Suite
```bash
cd backend
npm test
```
*Executes all 19 Jest integration and unit tests covering health checks, user profiles, streak metrics, 2026 Wrapped insights, leaderboards, algorithmic featured maintainers, and comparisons.*

### Validate Frontend Production Build
```bash
cd frontend
npm run build
```
*Runs Turbopack compile, ESLint checks, and static page generation across all 10 application routes.*

---

## 📚 API Reference

Base URL: `http://localhost:5001/api`

### 👤 Users API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | List indexed developers with pagination, search, and filters |
| `GET` | `/users/search?q=:query` | Search developers by username or name |
| `GET` | `/users/:username` | Get verified user profile (auto-syncs with GitHub GraphQL if stale) |
| `GET` | `/users/:username/wrapped` | **Get 2026 Developer Wrapped metrics, archetype persona, and stats** |
| `GET` | `/users/:username/streak` | Get continuous and longest streak statistics |
| `GET` | `/users/:username/badge.svg` | Dynamic SVG rank badge for GitHub READMEs |
| `GET` | `/users/:username/streak.svg` | Dynamic SVG streak card for GitHub READMEs |
| `POST` | `/users/:username/sync` | Force on-demand refresh from GitHub GraphQL |
| `GET` | `/users/:username/repositories` | List repositories with stargazers and forks |

### 🏆 Leaderboard API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/leaderboard` | Get ranked developers (`category=contributions\|commits\|followers\|repos`, `location=Pakistan`) |
| `GET` | `/leaderboard/stats` | Macro ecosystem statistics (total contributions, normalized top countries, top languages) |
| `GET` | `/leaderboard/featured` | Algorithmic spotlight (Worldwide, Pakistan, JavaScript, TypeScript, Python leaders) |
| `GET` | `/leaderboard/regions` | Dynamic regional quotas, follower requirements, and developer populations |
| `GET` | `/leaderboard/snapshots` | Historical 7-day regional snapshots |
| `POST` | `/leaderboard/sync/regions` | Trigger on-demand sync with official committers.top rankings |

### 📊 Analytics API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics` | Platform-wide contribution statistics and trends |
| `GET` | `/analytics/summary` | Global metric overview (commits, PRs, reviews, languages) |
| `POST` | `/analytics/compare` | Compare 2 or more developers side-by-side (`{ users: ['user1', 'user2'] }`) |

---

## ⚙️ Architecture & Ranking Engine

```
                               ┌─────────────────────────┐
                               │   GitHub GraphQL API    │
                               │ (365d contributions)    │
                               └────────────┬────────────┘
                                            │
                                            ▼
┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│     committers.top      ├───►│      Commity Core       │◄───┤    Developer Wrapped    │
│  Official Rank Ingestion │    │  Snapshot & Sync Engine │    │    Archetype Engine     │
└─────────────────────────┘    └────────────┬────────────┘    └─────────────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │  MongoDB Atlas Storage  │
                               │   (0ms Cached Query)    │
                               └────────────┬────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │   Express API (Port 5001) │                 │  Next.js 15 UI (Port 3000)│
       │  SVG Badges & JSON Routes │                 │ Turbopack + Tailwind CSS  │
       └───────────────────────────┘                 └───────────────────────────┘
```

1. **GitHub GraphQL Collection**: Instead of counting only default-branch public commits (like standard profile headers), Commity queries GitHub's `contributionsCollection` to capture:
   - Public commits + Private contributions
   - Pull requests created & merged
   - Code reviews conducted
   - Issues opened & resolved
2. **committers.top Sync Cadence**: Synchronizes with committers.top weekly rankings every Monday at 02:00 AM UTC. Ranks are preserved as authoritative fields (`countryRankAll`, `countryRankCommits`, `countryRankPublic`).
3. **Zero-Latency In-Memory Caching**: Redis-compatible in-memory caching layers ensure instant sub-millisecond responses for high-traffic endpoints.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure all tests pass before submitting a PR:
```bash
cd backend && npm test
cd ../frontend && npm run build
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Made with ❤️ by [WaleedCodes](https://github.com/waleedcodes) and open source contributors.

**⭐ Star Commity on GitHub if you find it useful!**

</div>
