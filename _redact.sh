#!/bin/sh
if [ -f server/.env ]; then
  sed -i.bak 's/SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYWNmanFrdWlrbHdzanVmcmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA4NTM1NiwiZXhwIjoyMTAzNjYxMzU2fQ\.7lFGVD1G1vkBBoOLZGgmSz_WpjBzJuG-VUkF1YWf31I/SUPABASE_SERVICE_ROLE_KEY=REDACTED/' server/.env
  rm -f server/.env.bak
fi
