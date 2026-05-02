# Repository Notes

## Stack And Layout
- This is a single-package npm project; use `npm install`/`npm ci` and keep `package-lock.json` in sync with `package.json`.
- Next.js uses both routers: UI pages live in `app/`, API routes remain under `pages/api/`.
- Shared client/server code is organized outside `src/`: `features/`, `components/`, `services/`, `server/`, `config/`, `hooks/`, `lib/`.
- Path aliases are configured in `jsconfig.json`; `@/server/*`, `@/services/*`, `@/features/*`, and `@/*` resolve from the repo root.
- Prisma is MySQL-only in `prisma/schema.prisma`; the local DB in `docker-compose.yml` is `mysql://spotly:spotly@localhost:3306/spotly`.

## Commands
- Dev server: `npm run dev` starts Next on port `3001`; `npm run dev-turbo` uses Turbopack with IPv4-first DNS.
- Build: `npm run build` runs `validate-env`, `prisma generate`, then `next build --no-lint`; run `npm run lint` separately when needed.
- Full local check: `npm run check` runs `validate-env -> test -> build`.
- Unit tests: `npm test`; focused test example: `npm test -- services/client/api.test.js`.
- Strict lint: `npm run lint:strict` fails on warnings.
- E2E: `npm run e2e`; Playwright starts `next dev -p 3101`, runs serially with one worker, and expects a usable `DATABASE_URL`.
- Prisma local schema sync: `npx prisma db push` or `npm run "update prisma"`; production deploy uses `npx prisma migrate deploy`.
- Seed defaults: `npm run seed`; demo data: `npm run seed:demo`; LDAP seed: `npm run seed:ldap`; production seed: `npm run seed:prod`.

## Environment And Data
- Copy `.env.local.template` to `.env.local` for local work; `validate-env` treats missing values as warnings locally but errors in production or `CI=true`.
- Required strict env keys are `DATABASE_URL`, `AUTH_SECRET`, `LDAP_ENCRYPTION_KEY`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_API_ENDPOINT`.
- `NEXT_PUBLIC_BASE_PATH` affects `next.config.mjs`, middleware redirects, and the NextAuth `SessionProvider` base path; keep URL-related tests/config in sync when changing it.
- `NEXT_PUBLIC_API_ENDPOINT` is used by client fetch helpers and cron mail calls; in e2e it is forced to `http://127.0.0.1:3101`.
- The mail smoke test is skipped unless `SEND_MAIL_SMOKE=1`; `npm run test:mail:send` sends every template to `MAIL_SMOKE_TO` or `admin@admin.fr` using the active encrypted SMTP config in the DB.

## App Behavior To Preserve
- `middleware.js` protects all non-public routes, returns JSON 401 for unauthenticated API calls, and restricts `/admin` to `ADMIN` or `SUPERADMIN` roles.
- Auth is NextAuth v4 credentials-based with local password, LDAP fallback, and Kerberos ticket support in `pages/api/auth/[...nextauth].js`.
- Use `@/server/services/databaseService` for DB access in app/API code; it wraps `server/prisma/init.js`, which registers the `entry.returnedConfirmationCode` Prisma middleware.
- Reservation control modes depend on pickable priority: resource pickable overrides category pickable, which overrides domain pickable.
- Cron logic runs as one-shot commands (`npm run "run cron"` and `npm run "run cron:daily"`) scheduled by the system cron; Vercel does not run permanent processes.

## Deployment Notes
- Vercel is configured to install with `npm ci`, build with `npm run build`, and serve Next.js functions from `pages/api/**/*.js` with `maxDuration: 30`.
- Production seeding requires `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, and `SEED_ADMIN_PASSWORD` of at least 12 characters; do not run it before a secure admin account plan is clear.
