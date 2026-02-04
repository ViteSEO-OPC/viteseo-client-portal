# Setting Up Access Codes

## Prerequisites
1. Database schema pushed to Supabase (`npm run db:push`)
2. Client folder created in `clients/[client-slug]/` with `data.json`

## Adding Access Codes via Supabase Dashboard

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project
3. Click **Table Editor** in the sidebar
4. Select the `access_codes` table
5. Click **Insert row**

### Required Fields:

| Field | Example Value | Description |
|-------|---------------|-------------|
| `code` | `SAMPLE2024` | The code clients will enter (uppercase recommended) |
| `client_slug` | `sample-client` | Must match the folder name in `clients/` |
| `is_active` | `true` | Set to `false` to deactivate |
| `max_uses` | `100` | Maximum number of times code can be used |

### Optional Fields:

| Field | Example Value | Description |
|-------|---------------|-------------|
| `expires_at` | `2024-12-31T23:59:59Z` | Code expiration date |
| `client_id` | `null` | Link to clients table (optional) |
| `quote_id` | `null` | Link to quotes table (optional) |

## Adding Access Codes via SQL

Open **SQL Editor** in Supabase and run:

```sql
-- Add access code for sample-client
INSERT INTO access_codes (
  id,
  code,
  client_slug,
  is_active,
  max_uses,
  used_count,
  failed_attempts,
  created_at
) VALUES (
  gen_random_uuid(),
  'SAMPLE2024',
  'sample-client',
  true,
  100,
  0,
  0,
  NOW()
);

-- Add another client access code
INSERT INTO access_codes (
  id,
  code,
  client_slug,
  is_active,
  max_uses,
  used_count,
  failed_attempts,
  expires_at,
  created_at
) VALUES (
  gen_random_uuid(),
  'ACME2024',
  'acme-corp',
  true,
  50,
  0,
  0,
  '2024-12-31T23:59:59Z',
  NOW()
);
```

## Creating a New Client

1. Create folder: `clients/[client-slug]/`
2. Create `data.json` with client info:

```json
{
  "clientName": "Company Name",
  "contactName": "Contact Person",
  "email": "contact@company.com",
  "activeQuote": "quote-2024-001.pdf",
  "quoteNumber": "Q-2024-0001",
  "validUntil": "2024-12-31T23:59:59Z",
  "total": "150000",
  "currency": "PHP",
  "items": [
    {
      "id": "1",
      "name": "Service Name",
      "description": "Service description",
      "quantity": 1,
      "unitPrice": "50000"
    }
  ]
}
```

3. Add the quote PDF file to the same folder (matching `activeQuote` filename)
4. Add access code to Supabase (see above)

## Testing the Flow

1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000/enter-code`
3. Enter the access code (e.g., `SAMPLE2024`)
4. You should be redirected to `/portal/sample-client`
5. The page displays quote data from `clients/sample-client/data.json`

## Deactivating an Access Code

In SQL Editor:
```sql
UPDATE access_codes
SET is_active = false
WHERE code = 'SAMPLE2024';
```

## Viewing Access Code Usage

```sql
SELECT code, client_slug, used_count, max_uses, is_active, created_at
FROM access_codes
ORDER BY created_at DESC;
```
