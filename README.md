# Mygreat Study Abroad — TanStack Start

Mygreat is a full-stack React application built on TanStack Start.

## Stack

- TanStack Start, TanStack Router, Vite, and React 19
- Netlify's official TanStack Start Vite integration
- TanStack Query, Form, and Table
- TanStack Intent for versioned agent guidance
- TypeScript in strict mode
- Tailwind CSS v4
- Lucide React and Framer Motion
- Zod and Zustand
- PostgreSQL and Prisma ORM

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and a random `SESSION_SECRET` of at least 32 characters.
3. Install packages with `npm install`.
4. Run database migrations with `npm run db:migrate`.
5. Optionally seed the first administrator with `npm run db:seed`.
6. Start the app with `npm run dev`.

The application runs at `http://localhost:3000`.

## Commands

```bash
npm run dev
npm run typecheck
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Application routes

- `/` — public landing page
- `/login/:accountType` — student, partner, and administrator sign-in
- `/onboarding` — student planning and registration
- `/dashboard` — authenticated student workspace
- `/staff` — authenticated staff overview
- `/staff/students` — staff student pipeline
- `/staff/team` — team management
- `/staff/partners` — partner reviews

Authentication uses Prisma-backed sessions in HTTP-only cookies. Authorization is enforced in TanStack route guards, server functions, and mutating route handlers.

TanStack does not currently publish an official chart runtime. Existing visualizations remain repository-owned UI until an official TanStack Charts package exists.

## Netlify deployment

The repository includes `netlify.toml` and Netlify's official TanStack Start
Vite plugin. Connect the GitHub repository in Netlify and configure the
production environment variables from `.env.example`. Netlify will run
`npm run build`, publish `dist/client`, and deploy SSR, server functions, and
API routes as Netlify Functions.
