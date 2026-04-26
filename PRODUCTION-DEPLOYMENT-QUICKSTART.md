# 🚀 CampusCart Production Deployment Quick Start

## ✅ Schema Status: READY FOR PRODUCTION

Your database schema is complete with:
- ✅ 15 tables
- ✅ 40+ RLS policies
- ✅ 15+ PostgreSQL functions
- ✅ 7+ triggers
- ✅ Storage buckets configured
- ✅ All migrations tracked

**You have everything you need in `/supabase/` folder!**

---

## 📋 Quick Deployment Checklist

### 1. Create Production Supabase Database

```bash
# Go to: https://supabase.com/dashboard
# Click "New Project"
# Name: campuscart-production
# Database Password: [generate strong password - SAVE IT!]
# Region: Choose closest to your users (e.g., Africa/Europe)
```

**Save these values:**
- Project Reference ID: `<PROD_PROJECT_REF>`
- API URL: `https://<PROD_PROJECT_REF>.supabase.co`
- `anon` public API key
- `service_role` secret key (DO NOT expose publicly!)
- Database password

---

### 2. Deploy Database Schema to Production

```bash
# Link to production project
npx supabase link --project-ref <PROD_PROJECT_REF>
# Enter database password when prompted

# Push all migrations to production
npx supabase db push

# ✅ This applies schema.sql + all 21 migrations automatically
```

---

### 3. Verify Database Deployment

Check in Supabase Dashboard → SQL Editor:

```sql
-- Should return 15
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return 40+
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public';

-- Should return 15+
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema = 'public';
```

---

### 4. Populate Reference Data

Insert universities and categories (if not in migrations):

```sql
-- Your universities and categories seed data
-- (Check if this is already in a migration)
```

---

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (run in campus-cart directory)
vercel link

# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://<PROD_PROJECT_REF>.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: [production anon key from Supabase]

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: [production service_role key - KEEP SECRET!]

# Deploy to production
vercel --prod
```

---

### 6. Add Custom Domain (campuscart.social)

**In Vercel Dashboard:**
1. Go to your project → Settings → Domains
2. Add domain: `campuscart.social`
3. Copy the DNS records shown

**In Namecheap Dashboard:**
1. Login to Namecheap
2. Go to Domain List → campuscart.social → Manage
3. Advanced DNS tab
4. Add these records:
   ```
   Type: A Record
   Host: @
   Value: 76.76.21.21
   TTL: Automatic
   
   Type: CNAME
   Host: www
   Value: cname.vercel-dns.com
   TTL: Automatic
   ```

5. Wait for DNS propagation (5-60 minutes)
6. Vercel will auto-provision SSL certificate

---

### 7. Verify Production Deployment

✅ Visit https://campuscart.social
✅ Check HTTPS lock icon (SSL working)
✅ Test user registration
✅ Test listing creation
✅ Test image uploads
✅ Test search functionality

---

## 🔒 Security Checklist

- [ ] Production database uses different credentials than dev
- [ ] `.env.local` is in `.gitignore` (never committed)
- [ ] Environment variables stored in Vercel, not in code
- [ ] `service_role` key NEVER exposed to frontend
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket policies configured

---

## 📊 Performance Optimization

Vercel automatically provides:
- ✅ Global CDN (fast worldwide)
- ✅ Auto-scaling (handles traffic spikes)
- ✅ Load balancing (distributed requests)
- ✅ Edge caching (static assets)
- ✅ Image optimization
- ✅ Free SSL certificate

No additional configuration needed!

---

## 🆘 Rollback Plan

If something goes wrong:

```bash
# Vercel keeps all deployments
# Instant rollback in dashboard:
# Deployments → [previous version] → Promote to Production

# Or via CLI:
vercel rollback
```

Database rollback (if needed):
```bash
# Supabase has automatic daily backups
# Restore via Dashboard → Database → Backups
```

---

## 📈 Monitoring

**Vercel Analytics** (built-in):
- Go to project → Analytics
- View traffic, performance, errors

**Supabase Monitoring**:
- Dashboard → Reports
- View database performance, API usage

**Optional:** Set up Sentry for error tracking

---

## 💰 Cost Estimate

**Vercel:**
- Hobby (Free): Up to 100GB bandwidth/month
- Pro ($20/mo): Unlimited bandwidth, team features

**Supabase:**
- Free: Up to 500MB database, 1GB storage
- Pro ($25/mo): 8GB database, 100GB storage

**Namecheap Domain:**
- Already purchased ✅

**Total:** $0-45/month depending on usage

---

## 🎉 You're Ready!

All your database objects are tracked in:
- `/supabase/schema.sql` - Foundation
- `/supabase/migrations/*.sql` - 21 incremental changes

**No extraction needed. Just deploy!**

Questions? Review:
- `docs/database-schema-inventory.md` - Complete schema documentation
- `extract-from-supabase.sh` - Backup extraction methods
- `extract-supabase-schema.md` - Detailed extraction guide
