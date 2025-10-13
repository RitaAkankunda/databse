# Backend (Express + Prisma + MySQL)

This backend exposes a REST API for the Asset Management System and uses Prisma to access a MySQL database.

## Prerequisites
- Node.js 18+
- MySQL 8+ running locally or remotely

## 1) Configure environment
Create a `.env` file in this folder with your MySQL connection string and server port:

```
DATABASE_URL="mysql://root:password@localhost:3306/asset_db"
PORT=4000
```

Tip: If your team prefers, copy from `.env.example` (create one if missing) and adjust values.

## 2) Install dependencies

```bash
npm install
```

## 3) Create database schema
Generate the Prisma client and push the schema to your MySQL database:

```bash
npm run db:setup
# which runs: prisma generate && prisma db push
```

If you already have an existing database schema, you can introspect it instead:

```bash
npm run prisma:pull && npm run prisma:generate
```

## 4) Run the API server

```bash
npm run dev
# Server will start on http://localhost:4000 by default
```

### Health check
Open `http://localhost:4000/api/health` — you should get `{ ok: true }`.

## Notes
- The Prisma client is generated into `src/generated/prisma`. Do not edit generated files.
- If you change `prisma/schema.prisma`, re-run `npm run prisma:generate` or `npm run db:setup`.
- Ensure your MySQL user has permissions to create/alter tables when using `db push`.