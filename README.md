# StoneHearts

A full-stack Go (Baduk / Weiqi) game management and analysis platform.

Record games, import SGF files, review with AI-powered analysis via [KataGo](https://github.com/lightvector/KataGo), and explore principal variations — all from your browser.

## Architecture

```
stonehearts/
├── backend/        # FastAPI + SQLAlchemy + Alembic
├── frontend/       # Nuxt 3 + Vue 3 + Vuetify + Pinia
└── docker-compose.yml
```

The backend provides a REST API for game management and a WebSocket endpoint that relays analysis requests to a [katago-server](../katago-server/) instance. The frontend is a single-page application (SPA) built with Nuxt 3.

### Companion projects

| Project | Description |
|---------|-------------|
| [katago-server](../katago-server/) | Standalone KataGo analysis server with WebSocket and MCP interfaces |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) A [katago-server](../katago-server/) instance for AI analysis
- (Optional) Google OAuth credentials for user login

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings (all have sensible defaults)
```

### 2. Start services

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Backend** on port 8000
- **Frontend** on port 3000

Open [http://localhost:3000](http://localhost:3000) to use the app.

### 3. Run database migrations

On first run, apply the database schema:

```bash
docker compose exec backend alembic upgrade head
```

## Development Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Start PostgreSQL (via Docker or locally)
# Set environment variables or create backend/.env

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts on [http://localhost:3000](http://localhost:3000). Configure `NUXT_PUBLIC_API_BASE_URL` to point to your backend (defaults to empty, meaning same-origin).

## Features

### Game Management
- Create new games with configurable board size (9×9, 13×13, 19×19), komi, and rules
- Import games from SGF files
- Track player names, game date, result, and draft status
- Browse saved games with board position thumbnails

### Interactive Board
- SVG-based Go board with stone placement, hover preview, and touch support
- Move navigation (step, ±10, start, end, keyboard arrows)
- Variation branching — explore alternative lines with backup/restore
- Set a variation as the new main line

### AI Analysis
- Real-time KataGo analysis via WebSocket relay to [katago-server](../katago-server/)
- Top move candidates with win rate, score lead, and visit count
- Principal variation preview — hover on candidate moves to see the continuation
- PV mode — step through a principal variation move by move
- Win rate chart with click-to-navigate

### Authentication
- Google OAuth login (optional — the app runs fully without it)
- Anonymous game creation with configurable expiry
- JWT-based session management

## API

The backend exposes a REST API under `/api/v1`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/auth/google` | Google OAuth login |
| `GET` | `/api/v1/users/me` | Current user profile |
| `DELETE` | `/api/v1/users/me` | Delete account |
| `GET` | `/api/v1/games` | List games |
| `POST` | `/api/v1/games` | Create a game |
| `GET` | `/api/v1/games/{id}` | Get game with analysis |
| `PUT` | `/api/v1/games/{id}` | Update game metadata |
| `DELETE` | `/api/v1/games/{id}` | Delete a game |
| `POST` | `/api/v1/games/{id}/moves` | Add a move |
| `DELETE` | `/api/v1/games/{id}/moves/{move_id}` | Delete a move |
| `POST` | `/api/v1/games/sgf` | Import from SGF |
| `WS` | `/api/v1/ws/analyze` | Analysis WebSocket |

## Tech Stack

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) — async web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) 2.0 — async ORM with `Mapped` types
- [Alembic](https://alembic.sqlalchemy.org/) — database migrations
- [PostgreSQL](https://www.postgresql.org/) — database
- [Pydantic](https://docs.pydantic.dev/) — settings and data validation

### Frontend
- [Nuxt 3](https://nuxt.com/) — Vue meta-framework (SPA mode)
- [Vue 3](https://vuejs.org/) — reactive UI
- [Vuetify 3](https://vuetifyjs.com/) — Material Design components
- [Pinia](https://pinia.vuejs.org/) — state management
- [@sabaki/go-board](https://github.com/SabakiHQ/go-board) — Go game logic
- [ApexCharts](https://apexcharts.com/) — win rate charts

## License

MIT
