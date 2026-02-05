# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and route handlers.
- `components/`: Reusable UI components.
- `lib/`: Server/client utilities and business logic.
- `types/`: Shared TypeScript types.
- `prisma/`: Prisma schema, migrations, and seed scripts.
- `tests/`: Vitest unit tests (`tests/lib/*.test.ts`) and Playwright e2e (`tests/e2e/**/*.spec.ts`).
- `clients/<client-slug>/`: Client data (`data.json`) and quote PDFs referenced by the portal.
- `public/`: Static assets.
- `scripts/`: One-off tasks (example: `sync-quotes.ts`).
- `docs/`: Process docs (example: `SETUP_ACCESS_CODES.md`).

## Build, Test, and Development Commands
- `npm run dev`: Start the Next.js dev server.
- `npm run build`: Production build.
- `npm run start`: Run the production server.
- `npm run lint` / `npm run lint:fix`: Run ESLint (Next core-web-vitals config).
- `npm run typecheck`: TypeScript type check only.
- `npm run test`: Vitest unit tests.
- `npm run test:coverage`: Unit tests with coverage.
- `npm run test:e2e`: Playwright end-to-end tests.
- `npm run db:push` / `npm run db:migrate`: Sync or migrate the Prisma schema.
- `npm run db:seed`: Seed data (`prisma/seed.ts`).
- `npm run db:studio`: Open Prisma Studio.

## Coding Style & Naming Conventions
- TypeScript + React (Next.js). Use 2-space indentation and single quotes, matching existing files.
- Components in `PascalCase.tsx`, utilities in `camelCase.ts`.
- Tailwind CSS is the primary styling system.
- Keep lint passing via `next lint`; rules live in `.eslintrc.json`.

## Testing Guidelines
- Unit tests live in `tests/lib` with `*.test.ts` naming.
- E2E tests live in `tests/e2e` with `*.spec.ts` naming and Playwright config in `playwright.config.ts`.
- Add or update tests for new logic or flows; run the relevant test command in PRs.

## Commit & Pull Request Guidelines
- Commit messages are short, imperative, and capitalized (examples: "Update CSP configuration", "Enhance admin interface").
- PRs should include a clear description, testing notes (commands run), and screenshots for UI changes.
- Link related issues or tickets when applicable, and update docs if the flow changes.

## Data & Access Codes
- Access code workflows are documented in `docs/SETUP_ACCESS_CODES.md`.
- Client slugs must match the `clients/<client-slug>/` folder and the Supabase `access_codes.client_slug` value.
