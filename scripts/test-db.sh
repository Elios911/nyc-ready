#!/usr/bin/env bash
# Apply the migrations + seed to a throwaway local Postgres and run the RLS tests.
#
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/nycr_test scripts/test-db.sh
#
# The target database is DROPPED AND RECREATED. Point it at a scratch database,
# never at a real Supabase project. With the Supabase CLI you can instead run
# `supabase db reset` and then `psql "$SUPABASE_DB_URL" -f supabase/tests/rls.test.sql`.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to a scratch Postgres database (it will be reset)}"
cd "$(dirname "$0")/.."

db_name="${DATABASE_URL##*/}"
db_name="${db_name%%\?*}"
admin_url="${DATABASE_URL%/*}/postgres"

case "$db_name" in
  postgres|"") echo "Refusing to reset the '$db_name' database. Use a dedicated scratch database." >&2; exit 1 ;;
esac

psql "$admin_url" -v ON_ERROR_STOP=1 -q -c "drop database if exists \"$db_name\" with (force)" -c "create database \"$db_name\""

run() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$1"; }

run supabase/tests/local/auth-stub.sql
for migration in supabase/migrations/*.sql; do
  echo "Applying $migration"
  run "$migration"
done
echo "Applying supabase/seed.sql"
run supabase/seed.sql
echo "Running RLS tests"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -t -f supabase/tests/rls.test.sql
