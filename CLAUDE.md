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
| `POST /api/portal/pdf` | Client | Initiate PDF generation |
| `GET /api/portal/pdf/render` | Token | Render PDF (Playwright) |
| `/api/admin/*` | Admin | CRUD operations |
| `GET /api/health` | Public | Health check |
| `GET /api/cron/cleanup` | Cron | Cleanup expired data |

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

## Security Requirements

When implementing features:
- Use `crypto.timingSafeEqual` for OTP comparison with 200-500ms artificial delay
- Hash OTPs with Argon2id before storage
- Rotate session ID after successful OTP verification
- Limit concurrent sessions to 2 per client
- Store all timestamps in UTC, display in client timezone
- Use double-submit cookie pattern for CSRF protection
- All client PII fields must be encrypted at rest (use `lib/auth/encryption.ts`)

## Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection string (pooled)
- `DATABASE_URL_UNPOOLED` - Direct connection for migrations
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Rate limiting
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Admin auth
- `APP_URL` - Full application URL
- `SESSION_SECRET` - Session token signing (32+ chars)
- `ENCRYPTION_KEY` - PII field encryption (32+ chars)
- `SENTRY_DSN` - Error monitoring

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

## Deployment

1. Set up PostgreSQL (Supabase or Neon)
2. Set up Upstash Redis
3. Configure Clerk application
4. Set environment variables in Vercel
5. Deploy: `vercel --prod`
6. Run migrations: `npm run db:migrate:deploy`
