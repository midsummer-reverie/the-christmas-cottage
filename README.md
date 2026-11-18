# The Christmas Cottage

Next.js App Router starter for Vercel, with Neon PostgreSQL and Drizzle ORM.

## Local setup

1. Install Node.js 20.9 or newer.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env.local`.
4. Create a Neon project and put its pooled connection string in `.env.local` as `DATABASE_URL`.
5. Set `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` in `.env.local`. A secure secret was generated for the local environment; make a separate secret for deployment.
6. Set up Resend, verify a sender domain, and fill `RESEND_API_KEY` and `EMAIL_FROM` before enabling sign-up. Email verification is required before a new account can sign in.
7. Run `npm run db:generate`, then `npm run db:migrate` to create or update the database tables.
8. Run `npm run dev` and open `http://localhost:3000`.

The database connection is server-only. Do not expose `DATABASE_URL` in browser code or commit `.env.local`.

## Database status

The schema models members, mission submissions, Secret Santa participants, separate online and physical wishlists, private gift assignments, wishlist update alerts, and Better Auth users/sessions. Admin status is stored separately from the login account and must only be assigned by an administrator in the database. Shipping addresses and assignment results must only be returned by authenticated server routes to the participant who owns them (or an authorized admin); use `requireCurrentMember()` and `requireAdmin()` from `src/lib/current-member.ts` in protected server routes/pages.
