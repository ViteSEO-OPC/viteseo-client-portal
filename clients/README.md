# Client Quotes Directory

This folder contains client quotation files organized by client.

## Structure

```
clients/
├── [client-slug]/
│   ├── quote-2024-001.pdf
│   ├── quote-2024-002.pdf
│   └── data.json          # Client metadata
└── README.md
```

## Adding a New Client Quote

1. Create a folder with the client's slug (e.g., `acme-corp`)
2. Add the quote PDF file(s)
3. Create a `data.json` with client info:

```json
{
  "clientName": "ACME Corporation",
  "contactName": "John Doe",
  "email": "john@acme.com",
  "activeQuote": "quote-2024-001.pdf",
  "createdAt": "2024-01-15"
}
```

4. Add the access code to Supabase `access_codes` table:
   - `code`: The 8-character access code (e.g., "ACME2024")
   - `client_slug`: Folder name (e.g., "acme-corp")
   - `is_active`: true
   - `expires_at`: Expiration date (optional)

## Access Code Format

Codes should be:
- 8 characters
- Uppercase alphanumeric
- Easy to type (avoid 0/O, 1/I confusion)

Examples: `ACME2024`, `PROJ1234`, `VITE2024`
