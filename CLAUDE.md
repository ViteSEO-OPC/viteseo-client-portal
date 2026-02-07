# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vite SEO Client Quotation Portal - a secure, private Next.js application for managing and distributing client quotations. Clients authenticate via OTP (one-time passcode) to view quotes and download PDFs. No password management; admins generate access codes for clients.

## Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix lint errors
npm run typecheck        # TypeScript type checking

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations (dev)
npm run db:migrate:deploy # Deploy migrations (production)
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed demo data

# Quote sync (file system → database)
npm run sync:quotes      # Sync clients/ directory to database
npm run sync:quotes -- --dry-run  # Preview changes without applying

# Testing
npm run test             # Run unit tests
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run Playwright E2E tests
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend/Backend | Next.js 14+ (App Router) | Server Components, API routes, middleware |
| Database | PostgreSQL (Supabase/Neon) | Primary storage with encryption at rest |
| ORM | Prisma | Type-safe queries, migrations, connection pooling |
| Admin Auth | Clerk | MFA support, secure admin sessions |
| Client Auth | Custom OTP + httpOnly cookies | No localStorage, secure session management |
| Validation | Zod | Runtime type validation for all inputs |
| Rate Limiting | Upstash Redis | Serverless-friendly, sliding window algorithm |
| PDF Generation | Playwright | Headless browser for exact portal-to-PDF fidelity |
| UI Framework | Tailwind CSS + shadcn/ui | Consistent design, accessible components |
| Deployment | Vercel | Edge functions, automatic HTTPS, easy scaling |
| Monitoring | Sentry + Vercel Analytics | Error tracking, performance monitoring |

## Architecture

### Security Model (Defense in Depth)
Seven layers: Edge (CloudFlare WAF) → Transport (HTTPS/TLS 1.3) → Application (Zod validation, CSRF, CSP) → Authentication (Argon2id OTP hashing, timing-safe comparison) → Authorization (server-side session validation) → Data (encryption at rest, PII encryption) → Audit (comprehensive logging)

### Key Design Decisions
- Server Components by default for security
- Session managed via httpOnly cookies only (no client-side tokens)
- Quotes immutable after SENT status (modifications create new versions)
- Unauthenticated requests return 404 (not 401/403) to avoid information leakage
- PDF tokens are short-lived (60s TTL, single-use)
- Admin preview tokens: 5-minute TTL

### Middleware Routing
Clerk middleware protects `/admin(.*)` routes (redirects unauthenticated users to sign-in). All API responses get `Cache-Control: no-store` headers. Security headers applied globally. Client portal auth is session-based (not middleware-enforced — validated in API routes/server components).

### Data Model
Core entities: `clients`, `quotes`, `quote_items`, `access_codes`, `sessions`, `pdf_render_tokens`, `admin_preview_tokens`, `audit_logs`, `pdf_cache`

Quote states: DRAFT → SENT → VIEWED → ACCEPTED/REJECTED/EXPIRED/SUPERSEDED

### File-System as Source of Truth
Quotes are defined in the `clients/` directory and synced to the database:
```
clients/
├── [portal-slug]/
│   ├── client.manifest.json       # Client metadata
│   └── quotes/
│       └── [quote-number]/
│           ├── quote.manifest.json  # Quote data (items, total, etc.)
│           └── page.tsx             # Optional: Custom quote page
```
Run `npm run sync:quotes` to sync changes. Immutable quotes (SENT or later) create new versions instead of updating.

### API Endpoints
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/auth/verify-code` | Public | OTP verification |
| `GET /api/portal/me` | Client | Get profile |
| `GET /api/portal/quote` | Client | Get quote |
| `POST /api/portal/quote/accept` | Client | Accept a quote |
| `POST /api/portal/quote/reject` | Client | Reject a quote |
| `POST /api/portal/pdf` | Client | Initiate PDF generation |
| `GET /api/portal/pdf/render` | Token | Render PDF (Playwright) |
| `/api/admin/clients/*` | Admin | Client CRUD |
| `/api/admin/quotes/*` | Admin | Quote CRUD |
| `/api/admin/quotes/[id]/items/*` | Admin | Quote item CRUD |
| `/api/admin/access-codes/*` | Admin | Access code management |
| `/api/admin/sessions/*` | Admin | Session management |
| `/api/admin/audit-logs` | Admin | View audit logs |
| `POST /api/admin/preview` | Admin | Generate admin preview token |
| `GET /api/health` | Public | Health check |
| `GET /api/cron/cleanup` | Cron | Cleanup expired data (daily 2AM UTC) |

### Rate Limiting
- OTP verification: 5 attempts/15min, 30min lockout after failures
- Portal APIs: 60 requests/min
- PDF generation: 10 requests/hour
- Admin APIs: 120 requests/min

## File Structure

```
├── app/
│   ├── (main)/               # Main route group with standard layout
│   │   ├── admin/            # Admin pages (Clerk protected)
│   │   ├── enter-code/       # Public OTP entry
│   │   └── portal/[slug]/    # Client portal (session protected)
│   ├── (pdf)/                # PDF render route group (minimal layout)
│   └── api/                  # API routes
├── clients/                  # Source of truth for quotes (synced to DB)
├── components/               # React components
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── auth/                 # OTP, session, encryption
│   ├── pdf/                  # Playwright PDF generation
│   ├── query/                # React Query hooks and API client
│   └── quotes/               # Quote discovery and sync
├── prisma/                   # Database schema and migrations
├── scripts/                  # Utility scripts (sync-quotes, create-access-code)
└── tests/                    # Unit and E2E tests
```

## Agent Skills

This repository includes specialized Claude agent skills in `.agents/skills/`:

### UI/UX Pro Max (`ui-ux-pro-max`)
```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain>
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack nextjs
```

### Web App Testing (`webapp-testing`)
```bash
python .agents/skills/webapp-testing/scripts/with_server.py --server "npm run dev" --port 3000 -- python automation.py
```

## Utility Scripts

```bash
# Create access code for a client
tsx scripts/create-access-code.ts <clientSlug> <plainCode>

# Rehash a client email
tsx scripts/rehash-client-email.ts <portalSlug> <email>
```

Access code format: exactly 8 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes 0/O, 1/I/l to avoid ambiguity).

## Security Requirements

When implementing features:
- Use `crypto.timingSafeEqual` for OTP comparison with 200-500ms artificial delay
- Hash OTPs with Argon2id before storage (memoryCost=65536, timeCost=3, parallelism=4)
- Rotate session ID after successful OTP verification
- Limit concurrent sessions to 2 per client
- Store all timestamps in UTC, display in client timezone
- Use double-submit cookie pattern for CSRF protection (HMAC-signed)
- All client PII fields must be encrypted at rest (AES-256-GCM via `lib/auth/encryption.ts`)
- Session cookie: `__vite_session`, max age 4 hours
- CSRF cookie: `__csrf_token`

## Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string (pooled)
- `DATABASE_URL_UNPOOLED` - Direct connection for migrations
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Rate limiting
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Admin auth
- `APP_URL` - Full application URL
- `SESSION_SECRET` - Session token signing (32+ chars)
- `ENCRYPTION_KEY` - PII field encryption (32+ chars)
- `CSRF_SECRET` - CSRF token signing (falls back to SESSION_SECRET if unset)
- `CRON_SECRET` - Authenticates Vercel cron job requests
- `PDF_RENDER_BASE_URL` - Internal URL for Playwright PDF access
- `SENTRY_DSN` - Error monitoring

Optional:
- `NEXT_PUBLIC_TAWK_PROPERTY_ID` - Tawk.to property ID for live chat
- `NEXT_PUBLIC_TAWK_WIDGET_ID` - Tawk.to widget ID for live chat

## Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx vitest run tests/lib/otp.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests headed (see browser)
npx playwright test --headed
```

## Vercel Configuration

- Deployment region: `sin1` (Singapore)
- PDF render route: 30s timeout, 1024MB memory (`app/api/portal/pdf/render/route.ts`)
- Cron: `/api/cron/cleanup` runs daily at 2AM UTC
- All routes served with `X-Robots-Tag: noindex, nofollow, noarchive` (private portal, not indexed)
- Node.js >= 18.17.0 required

## Deployment

1. Set up PostgreSQL (Supabase or Neon)
2. Set up Upstash Redis
3. Configure Clerk application
4. Set environment variables in Vercel
5. Deploy: `vercel --prod`
6. Run migrations: `npm run db:migrate:deploy`

## Coding Style

- TypeScript + React (Next.js), 2-space indentation, single quotes
- Components in `PascalCase.tsx`, utilities in `camelCase.ts`
- Tailwind CSS for styling
- Client slugs must match the `clients/<client-slug>/` folder and the database `access_codes.client_slug` value
