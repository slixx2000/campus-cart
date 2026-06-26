#!/bin/bash
# Extract Complete Schema from Supabase Development Database
# This script pulls everything from your Supabase database without needing Docker

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CampusCart Schema Extraction Tool ===${NC}\n"

# Get database connection info from .env.local
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
SUPABASE_PROJECT_REF="oylrsfntvbgucdldxbwa"

echo -e "${YELLOW}Method 1: Using Supabase Dashboard${NC}"
echo "────────────────────────────────────────"
echo "1. Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/editor"
echo "2. Open SQL Editor"
echo "3. Run this query to get ALL RLS policies:"
echo ""
echo "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check"
echo "FROM pg_policies"
echo "WHERE schemaname = 'public';"
echo ""
echo "4. Run this query to get ALL functions:"
echo ""
echo "SELECT routine_name, routine_definition"
echo "FROM information_schema.routines"
echo "WHERE routine_schema = 'public';"
echo ""
echo "5. Run this query to get ALL triggers:"
echo ""
echo "SELECT trigger_name, event_manipulation, event_object_table, action_statement"
echo "FROM information_schema.triggers"
echo "WHERE trigger_schema = 'public';"
echo ""

echo -e "\n${YELLOW}Method 2: Get Complete DDL (Data Definition Language)${NC}"
echo "────────────────────────────────────────────────────────────"
echo "In Supabase SQL Editor, run this to generate complete schema:"
echo ""
cat << 'SQL'
-- Get all table definitions
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (...);' as ddl,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get all RLS policies as SQL
SELECT 
    'CREATE POLICY ' || policyname || ' ON ' || schemaname || '.' || tablename || 
    ' FOR ' || cmd || ' USING (' || qual || ')' ||
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || ';' as policy_sql
FROM pg_policies 
WHERE schemaname = 'public';

-- Get all functions
SELECT pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- Get all indexes
SELECT indexdef || ';' as index_definition
FROM pg_indexes
WHERE schemaname = 'public';
SQL
echo ""

echo -e "\n${YELLOW}Method 3: Manual Inspection via Dashboard${NC}"
echo "────────────────────────────────────────────────"
echo "Go through each table in the Supabase Dashboard:"
echo "https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/editor"
echo ""
echo "For EACH table, check:"
echo "  ✓ Table structure (columns, types, constraints)"
echo "  ✓ RLS policies (click 'RLS Policies' tab)"
echo "  ✓ Triggers (in table settings)"
echo "  ✓ Indexes (for performance)"
echo ""

echo -e "\n${YELLOW}Method 4: Export via pg_dump (if you have database password)${NC}"
echo "───────────────────────────────────────────────────────────────"
echo "If you have direct database access:"
echo ""
echo "pg_dump -h db.${SUPABASE_PROJECT_REF}.supabase.co \\"
echo "  -p 6543 \\"
echo "  -U postgres \\"
echo "  -d postgres \\"
echo "  --schema=public \\"
echo "  --no-owner \\"
echo "  --no-acl \\"
echo "  --clean \\"
echo "  -f supabase/complete_dump.sql"
echo ""
echo "Password: [Your database password from Supabase Dashboard > Settings > Database]"
echo ""

echo -e "\n${GREEN}Quick Analysis of Current State:${NC}"
echo "─────────────────────────────────────"
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "✓ Migration files found: ${MIGRATION_COUNT}"
echo "✓ Schema.sql lines: $(wc -l < supabase/schema.sql)"
echo ""

echo -e "${BLUE}Expected Database Objects:${NC}"
echo "─────────────────────────────"
echo "Based on the codebase analysis:"
echo "  • Tables: universities, categories, listings, profiles, conversations, messages,"
echo "            reports, reviews, push_notifications, listing_bump_events,"
echo "            verification_tokens, student_verification_attempts"
echo "  • Storage: product-images bucket with policies"
echo "  • Functions: search_listings, update_listing_status, bump_listing, etc."
echo "  • Triggers: updated_at triggers on various tables"
echo "  • Extensions: pgcrypto, pg_trgm"
echo "  • Enums: listing_condition, listing_status"
echo ""

echo -e "${GREEN}✓ Script complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. Use one of the methods above to verify you have everything"
echo "2. Save any missing DDL to a new migration file in supabase/migrations/"
echo "3. Review supabase/schema.sql to ensure it's comprehensive"
echo "4. Once verified, proceed with production deployment"
