#!/bin/bash
# Verify schema completeness by analyzing existing migration files

echo "=== Schema Completeness Analysis ==="
echo ""

echo "📁 Migration Files (21 total):"
echo "───────────────────────────────"
ls -1 supabase/migrations/*.sql | nl
echo ""

echo "🔍 Analyzing Migration Contents..."
echo "──────────────────────────────────"

# Count different types of DDL statements
TABLES=$(grep -h "CREATE TABLE" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | wc -l)
POLICIES=$(grep -h "CREATE POLICY" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | wc -l)
FUNCTIONS=$(grep -h "CREATE.*FUNCTION" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | wc -l)
TRIGGERS=$(grep -h "CREATE TRIGGER" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | wc -l)
INDEXES=$(grep -h "CREATE.*INDEX" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | wc -l)
TYPES=$(grep -h "CREATE TYPE" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | wc -l)
EXTENSIONS=$(grep -h "CREATE EXTENSION" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | wc -l)

echo "✓ Tables: $TABLES"
echo "✓ RLS Policies: $POLICIES"
echo "✓ Functions: $FUNCTIONS"
echo "✓ Triggers: $TRIGGERS"
echo "✓ Indexes: $INDEXES"
echo "✓ Custom Types: $TYPES"
echo "✓ Extensions: $EXTENSIONS"
echo ""

echo "📋 Tables Found:"
echo "────────────────"
grep -h "CREATE TABLE" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | sed 's/.*CREATE TABLE //' | sed 's/ .*//' | sed 's/public\.//' | sort -u | nl
echo ""

echo "🔐 RLS Policies Found:"
echo "──────────────────────"
grep -h "CREATE POLICY" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | sed 's/.*CREATE POLICY "//' | sed 's/".*//' | head -20
echo "... (showing first 20)"
echo ""

echo "⚙️ Functions Found:"
echo "───────────────────"
grep -h "CREATE.*FUNCTION" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | sed 's/.*FUNCTION //' | sed 's/(.*//' | sort -u
echo ""

echo "🪣 Storage Configuration:"
echo "────────────────────────"
if grep -q "storage.buckets" supabase/migrations/*.sql 2>/dev/null || grep -q "storage.buckets" supabase/schema.sql 2>/dev/null; then
    echo "✓ Storage buckets configured"
    grep -h "storage.buckets" supabase/migrations/*.sql supabase/schema.sql 2>/dev/null | head -5
else
    echo "⚠️  No storage bucket configuration found in migrations"
fi
echo ""

echo "📊 Summary:"
echo "───────────"
if [ $TABLES -ge 10 ] && [ $POLICIES -ge 15 ]; then
    echo "✅ Schema appears comprehensive"
    echo "✅ You have $POLICIES RLS policies protecting $TABLES tables"
else
    echo "⚠️  Schema might be incomplete"
    echo "   Expected: ~12 tables, ~30+ policies"
    echo "   Found: $TABLES tables, $POLICIES policies"
fi
echo ""
echo "💡 Recommendation:"
if [ $POLICIES -lt 20 ]; then
    echo "   → Use the Supabase Dashboard SQL queries to verify all policies"
    echo "   → Go to: https://supabase.com/dashboard/project/oylrsfntvbgucdldxbwa/editor"
else
    echo "   → Schema looks good! Ready for production deployment"
fi
