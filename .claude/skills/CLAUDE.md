# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vite SEO Client Quotation Portal - a secure, private Next.js application for managing and distributing client quotations. Clients authenticate via OTP (one-time passcode) to view quotes and download PDFs. No password management; admins generate access codes for clients.

## Technology Stack

- **Frontend/Backend**: Next.js 14+ (App Router) with React Server Components
- **Database**: PostgreSQL (Supabase/Neon) with Prisma ORM
- **Rate Limiting**: Upstash Redis (sliding window algorithm)
- **PDF Generation**: Playwright (headless browser)
- **Admin Auth**: Clerk or Auth.js v5 with MFA
- **Client Auth**: Custom OTP + httpOnly cookies (no localStorage)
- **Validation**: Zod for runtime type validation
- **UI**: Tailwind CSS + shadcn/ui

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
Core entities: `clients`, `quotes`, `quote_items`, `access_codes`, `sessions`, `pdf_render_tokens`, `audit_logs`

Quote states: DRAFT → SENT → VIEWED → ACCEPTED/REJECTED/EXPIRED/SUPERSEDED

### API Endpoints
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/auth/verify-code` | Public | OTP verification |
| `GET /api/portal/me` | Client | Get profile |
| `GET /api/portal/quote` | Client | Get quote |
| `POST /api/portal/pdf` | Client | Generate PDF |
| `/api/admin/*` | Admin | CRUD operations |
| `GET /api/health` | Public | Health check |

### Rate Limiting
- OTP verification: 5 attempts/15min, 30min lockout after failures
- Portal APIs: 60 requests/min
- PDF generation: 10 requests/hour
- Admin APIs: 120 requests/min

## Agent Skills

This repository includes specialized Claude agent skills in `.agents/skills/`:

### UI/UX Pro Max (`ui-ux-pro-max`)
Design intelligence with 50+ styles, 97 color palettes, 57 font pairings. Use for UI design decisions.

```bash
# Generate complete design system
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<product_type> <keywords>" --design-system

# Search specific domain (style, color, typography, ux, chart, landing)
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain>

# Get stack-specific guidelines (html-tailwind, react, nextjs, vue, svelte, etc.)
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack nextjs
```

### Web App Testing (`webapp-testing`)
Playwright-based testing toolkit for web applications.

```bash
# Run automation with server management
python .agents/skills/webapp-testing/scripts/with_server.py --server "npm run dev" --port 5173 -- python your_automation.py
```

### Frontend Design (`frontend-design`)
Guidelines for creating distinctive, production-grade interfaces. Emphasizes bold aesthetic choices, avoiding generic AI aesthetics. Key principles:
- Choose distinctive fonts (avoid Inter, Roboto, Arial)
- Commit to a clear conceptual direction
- Use unexpected layouts, asymmetry, generous negative space
- Add atmosphere via gradients, textures, patterns

## Security Requirements

When implementing features:
- Use `crypto.timingSafeEqual` for OTP comparison with 200-500ms artificial delay
- Hash OTPs with Argon2id before storage
- Rotate session ID after successful OTP verification
- Limit concurrent sessions to 2 per client
- Store all timestamps in UTC, display in client timezone
- Use double-submit cookie pattern for CSRF protection
- All client PII fields must be encrypted at rest

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Redis for rate limiting
- `CLERK_SECRET_KEY` - Admin authentication
- `APP_URL` - Full application URL
- `SESSION_SECRET` - Session token signing
- `ENCRYPTION_KEY` - PII field encryption

## Documentation

- `vite-seo-complete-documentation-v2.pdf` - Complete system architecture (23 pages)
- `er_diagram.png` - Entity relationship diagram
