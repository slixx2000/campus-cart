# Extracting Complete Supabase Schema & Policies

## Step 1: Pull Current Database Schema

This will extract the **complete current state** of your database including all tables, policies, functions, triggers, and types that might not be in your migration files.

```bash
# Pull the complete schema from your dev database
npx supabase db pull

# This creates: supabase/schema.sql (complete database dump)
```

## Step 2: Generate Diff Migration (Recommended)

If you've made changes directly in the Supabase dashboard that aren't in migration files, generate a diff:

```bash
# This compares local migrations vs remote database
npx supabase db diff -f <migration_name>

# Example:
npx supabase db diff -f complete_schema_sync

# This creates a NEW migration file with any missing changes
```

## Step 3: Link to Your Development Database

First, link to your development project:

```bash
# Link to your dev project (you'll need the project reference)
npx supabase link --project-ref oylrsfntvbgucdldxbwa

# You'll be prompted to enter your database password
```

## Step 4: Extract RLS Policies Explicitly

View all RLS policies in SQL format:

```bash
# Get all RLS policies
npx supabase db dump --schema public --data-only=false > supabase/policies_dump.sql
```

## Step 5: Backup Everything

Create a complete backup before production setup:

```bash
# Full database dump (schema + data)
npx supabase db dump -f supabase/backup_full_$(date +%Y%m%d).sql

# Schema only (what you need for production)
npx supabase db dump --data-only=false -f supabase/backup_schema_only.sql
```

## What Each File Contains

- **schema.sql** - Complete current database state (auto-generated)
- **migrations/*.sql** - Individual migration files (version controlled)
- **backup_full_*.sql** - Complete backup with data (for disaster recovery)
- **backup_schema_only.sql** - Schema without data (for fresh production setup)

## Common Items That Might Be Missing

1. **RLS Policies** - Row Level Security policies created in dashboard
2. **Functions** - PostgreSQL functions/stored procedures
3. **Triggers** - Database triggers
4. **Views** - Database views
5. **Extensions** - Postgres extensions (pg_trgm, uuid-ossp, etc.)
6. **Storage Policies** - File storage bucket policies
7. **Custom Types** - ENUMs and custom types
8. **Indexes** - Performance indexes created manually

## Verification Checklist

After extraction, verify you have:
- [ ] All table definitions
- [ ] All RLS policies for each table
- [ ] All database functions (check for `CREATE OR REPLACE FUNCTION`)
- [ ] All triggers (`CREATE TRIGGER`)
- [ ] All views (`CREATE VIEW`)
- [ ] All extensions (`CREATE EXTENSION`)
- [ ] All custom types/enums (`CREATE TYPE`)
- [ ] Storage bucket configurations
- [ ] Foreign key constraints
- [ ] Check constraints

## Quick Check: Compare Migration Count vs Tables

```bash
# Count migration files
ls -1 supabase/migrations/*.sql | wc -l

# Count tables in your database (need to run in Supabase SQL editor):
# SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
```

If you have more tables than migrations, you're missing some!
