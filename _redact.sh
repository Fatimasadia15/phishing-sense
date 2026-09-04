#!/bin/sh
if [ -f server/.env ]; then
  sed -i.bak 's/SUPABASE_SERVICE_ROLE_KEY=.*/SUPABASE_SERVICE_ROLE_KEY=REDACTED/' server/.env
  rm -f server/.env.bak
fi
