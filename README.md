## Getting Started

### Environment setup

1. Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

2. Set these variables in `.env`:

| Variable                    | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`              | PostgreSQL connection string (e.g. Neon or local)       |
| `DB_SERVERLESS`             | Set to `true` for Neon/serverless, `false` for local pg |
| `NEXT_PUBLIC_APTABASE_HOST` | Aptabase API host (e.g. `http://localhost:8000`)        |
| `JWT_SECRET`                | Secret used for JWT signing (required for auth)         |

### Run the dev server

```bash
pnpm dev

```
