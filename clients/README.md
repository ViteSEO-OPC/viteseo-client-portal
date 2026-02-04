# Client Quotes Directory

This folder is the **source of truth** for client quotes. The portal syncs from here to the database.

## Directory Structure

```
clients/
├── [portal-slug]/                      # Client folder (e.g., acme-corp)
│   ├── client.manifest.json            # Client metadata (or legacy data.json)
│   └── quotes/
│       └── [quote-number]/             # e.g., Q-2024-0001
│           ├── quote.manifest.json     # Quote data (items, total, etc.)
│           └── page.tsx                # Optional: Custom quote page
└── README.md
```

## Adding a New Client

1. Create a folder with the client's portal slug (e.g., `acme-corp`)
2. Create `client.manifest.json`:

```json
{
  "companyName": "ACME Corporation",
  "contactName": "John Doe",
  "email": "john@acme.com",
  "timezone": "Asia/Manila",
  "status": "active"
}
```

## Adding a New Quote

1. Create a folder under `quotes/` with the quote number (e.g., `Q-2024-0001`)
2. Create `quote.manifest.json`:

```json
{
  "quoteNumber": "Q-2024-0001",
  "version": 1,
  "validUntil": "2024-12-31T23:59:59Z",
  "total": "150000",
  "currency": "PHP",
  "notes": "Optional notes about this quote",
  "items": [
    {
      "id": "1",
      "name": "SEO Audit & Strategy",
      "description": "Comprehensive website SEO audit with competitive analysis",
      "quantity": 1,
      "unitPrice": "50000"
    },
    {
      "id": "2",
      "name": "On-Page Optimization",
      "description": "Technical SEO fixes, meta tags, content optimization",
      "quantity": 1,
      "unitPrice": "35000"
    }
  ]
}
```

3. (Optional) Create a custom `page.tsx` for unique quote layouts

## Syncing to Database

Run the sync script to upsert clients and quotes to the database:

```bash
# Sync quotes (creates/updates in database)
npm run sync:quotes

# Dry run (preview changes without applying)
npm run sync:quotes -- --dry-run
```

The sync script:
- Creates or updates `Client` records (PII is encrypted)
- Creates or updates `Quote` and `QuoteItem` records
- **Immutability**: If a quote is already SENT/VIEWED/ACCEPTED, a new version is created
- Computes a `contentHash` for change detection

## Access Codes

After syncing, add access codes via the admin portal or directly to the database:

| Field | Description |
|-------|-------------|
| `code` | 8-char access code (e.g., `ACME2024`) |
| `client_slug` | Matches the folder name (e.g., `acme-corp`) |
| `is_active` | `true` to enable |
| `expires_at` | Optional expiration date (24-72 hours recommended) |

## Legacy Support

The system still supports `data.json` files from the previous format. They will be automatically converted during sync. However, new clients should use the manifest format.

## Access Code Format

Codes should be:
- 8 characters
- Uppercase alphanumeric
- Easy to type (avoid 0/O, 1/I confusion)

Examples: `ACME2024`, `PROJ1234`, `VITE2024`
