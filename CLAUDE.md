## Project

A budget tracker and expense manager app, built with Next.js.

### Planned structure

- **Showcase site**: public marketing pages that show off the app's features.
- **Auth**: visitors register and log in to use the app.
- **App**: the budget tracker / expense manager, available only to signed-in users.

### Currency

The app uses one currency for everyone: Philippine pesos (PHP). Store amounts as whole centavos (integers) and display them with `Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })`, e.g. ₱1,250.50. There's no per-user currency setting.

### Stack

- **Framework**: Next.js 16 (App Router), React 19, Tailwind CSS 4.
- **UI**: shadcn/ui (`base-vega` style, Base UI primitives, lucide icons). Components go in `components/ui`; add new ones with the shadcn CLI (`npx shadcn add <component>`) instead of writing them by hand. To make a `Button` act as a link, pass both `render={<Link href="…" />}` and `nativeButton={false}`, or Base UI logs a console error.
- **Database**: Neon (Lakebase Postgres), project linked in `.neon`, services declared in `neon.ts` (apply with `neon deploy`).
- **ORM**: Prisma 7 (pinned to 7.10.1; npm's `latest` tag for the `prisma` CLI is an 8.0 release candidate, so don't run `npm i prisma@latest`, and keep `prisma` and `@prisma/client` on the same version).
  - Use the shared client `prisma` from `lib/db.ts`, in server code only. It runs over the pooled `DATABASE_URL` through `@prisma/adapter-pg`.
  - The Prisma CLI uses `DATABASE_URL_UNPOOLED` (set in `prisma.config.ts`, which loads `.env.local` through `@next/env`). Don't create a `.env` file: `neon env pull` would start writing there instead of `.env.local`.
  - Schema lives in `prisma/schema.prisma`; generated client goes to `lib/generated/prisma` (git-ignored, regenerated on `npm install`). After schema changes, run `npx prisma migrate dev --name <change>` and then `npx prisma generate` (Prisma 7's `migrate dev` no longer regenerates the client).
  - Prisma owns only the `public` schema. Never model or migrate `neon_auth`. Link rows to users with `userId String @db.Uuid` holding `neon_auth."user".id`, and read auth tables with `prisma.$queryRaw` if needed.
- **Validation**: Zod 4 (`import { z } from "zod"`). Validate every server action and route handler input with a Zod schema before touching the database, and share the same schema with the client form. Put shared schemas in `lib/validations/`.
- **Client state**: Zustand 5, for client-side UI state only (filters, open dialogs, form drafts). Data that comes from the database is loaded in server components and changed via server actions, so don't copy it into stores. Following Zustand's Next.js guidance, create stores per request with `createStore` and a React context provider rather than module-level `create()` stores, so state never leaks between users during server rendering.
- **Auth**: Neon Auth (managed Better Auth) through `@neon/auth`. Server instance in `lib/auth/server.ts`, browser client in `lib/auth/client.ts`, proxy route at `app/api/auth/[...path]`. Sign-in/sign-up UI is Better Auth UI (`components/auth/*`), rendered at `/auth/[path]`. Users and sessions live in the `neon_auth` schema; link app tables to `neon_auth."user".id`. Don't call `betterAuth()` or run Better Auth migrations: Neon hosts the auth server.
- **Route protection**: `proxy.ts` requires sign-in for every route except `publicRoutes` (plus `/api/auth` and `/auth/*`). Add each new public showcase page to `publicRoutes`. Still check `auth.getSession()` in every page, route handler and server action that reads or changes user data.
- **App layout**: signed-in pages live in `app/(app)/` and share the sidebar layout in `app/(app)/layout.tsx` (the `(app)` folder isn't part of the URL). Add new sections to `NAV_ITEMS` in `components/app-shell/nav-main.tsx`, and start each page with `PageHeader` from `components/app-shell/page-header.tsx`. Public pages (landing, showcase) stay outside `(app)`.
- **Feature pattern** (follow `accounts` and `categories`): Zod schema in `lib/validations/<thing>.ts`; server-only loaders in `lib/data/<thing>.ts`; server actions in `app/(app)/<thing>/actions.ts` that call `requireUserId()` (`lib/auth/session.ts`), validate, filter every query by `userId`, return `ActionResult` (`lib/actions.ts`) and call `refresh()`; client form dialog and actions menu in `components/<thing>/`. Format money with `formatPeso()` and parse form amounts with `pesoAmount()` (`lib/money.ts`, `lib/validations/money.ts`).
- **Categories**: icons, colours and the starter set live in `lib/categories.ts`. Add an icon to `CATEGORY_ICONS` to offer it in the picker (no migration needed). New users get the starter categories the first time `getCategories()` runs; show category icons with `CategoryIcon`.
- **Dates**: transaction dates are calendar dates in Postgres `DATE` columns. Use the helpers in `lib/dates.ts` (`todayISO()`, `monthRange()`, `isoToDate()`, `dateToISO()`); "today" and "this month" are in Philippine time (`Asia/Manila`). Don't call `todayISO()`/`new Date()` while a client component renders; do it in an event handler (e.g. when a dialog opens).
- **Transactions**: the add/edit form is `TransactionFormDialog` (expense, income and transfer); it needs `TransactionFormOptionsProvider` (accounts + categories from `getTransactionFormOptions()`) above it. The last-used accounts are remembered in the Zustand store `stores/transaction-form-store.tsx`, provided in `app/(app)/layout.tsx`.
- **Cache Components is on**: components that read the session or query per-user data must sit inside `<Suspense>` and call `await connection()` first (see `app/dashboard/page.tsx`).
- **Env** (`.env.local`, git-ignored): `DATABASE_URL` and `NEON_AUTH_*` are pulled by `neon deploy` / `neon env pull`. `NEON_AUTH_COOKIE_SECRET` is ours (32+ chars, `openssl rand -base64 32`) and must also be set on the hosting platform.

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
