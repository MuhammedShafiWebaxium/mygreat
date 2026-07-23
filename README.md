# Mygreat Study Abroad — Next.js

Full migration of the Mygreat application to Next.js 15 App Router.

## Stack

- Next.js 15 App Router and React 19
- TypeScript in strict mode
- Tailwind CSS v4 and repository-owned shadcn/ui components
- Lucide React and Framer Motion
- TanStack Query
- React Hook Form and Zod
- Zustand with explicit client hydration
- PostgreSQL and Prisma ORM

## Local setup

1. Copy `.env.example` to `.env.local`.
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
- `/login` — student and staff sign-in
- `/onboarding` — student planning and registration flow
- `/dashboard` — authenticated student workspace
- `/staff` — authenticated staff overview
- `/staff/students` — staff student pipeline
- `/staff/team` — Super Admin team management

Authentication uses Prisma-backed database sessions in HTTP-only cookies. Authorization is enforced in both App Router layouts/pages and every mutating route handler. The app does not depend on Radix UI or Drizzle.
