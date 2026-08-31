---
kind: external_dependency
name: Supabase PostgreSQL Database (Optional, Backend Only)
slug: supabase
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

The backend optionally connects to Supabase using `@supabase/supabase-js` with the service role key, which bypasses row-level security and must only be used from server-side routes. Connection is gated by `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables; if either is missing the client is disabled and a warning is logged. Community reporting endpoints (`/api/community/report`, `/api/community/count`) are wired through this client.