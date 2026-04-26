#!/bin/bash
echo "=== Detailed Schema.sql Analysis ==="
echo ""

echo "📊 Database Objects in schema.sql:"
echo "───────────────────────────────────"
echo "Tables: $(grep -c "^create table" supabase/schema.sql)"
echo "RLS Policies: $(grep -c "^create policy\|^CREATE POLICY" supabase/schema.sql)"
echo "Functions: $(grep -c "^create function\|^create or replace function" supabase/schema.sql)"
echo "Triggers: $(grep -c "^create trigger" supabase/schema.sql)"
echo "Extensions: $(grep -c "^create extension" supabase/schema.sql)"
echo "Custom Types: $(grep -c "^create type" supabase/schema.sql)"
echo "Indexes: $(grep -c "^create.*index" supabase/schema.sql)"
echo ""

echo "📋 All Tables:"
echo "──────────────"
grep "^create table" supabase/schema.sql | sed 's/create table public\.//' | sed 's/ .*//' | nl
echo ""

echo "🔐 Sample RLS Policies:"
echo "───────────────────────"
grep "^create policy\|^CREATE POLICY" supabase/schema.sql | head -15
echo ""

echo "⚙️ Functions:"
echo "─────────────"
grep "^create.*function" supabase/schema.sql | sed 's/create or replace function //' | sed 's/create function //' | sed 's/(.*//' | sort -u
echo ""

echo "🔌 Extensions:"
echo "──────────────"
grep "^create extension" supabase/schema.sql
echo ""

echo "📦 Custom Types/Enums:"
echo "──────────────────────"
grep "^create type" supabase/schema.sql
echo ""
