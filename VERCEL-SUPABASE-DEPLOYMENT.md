# 🚀 FinFlux Vercel + Supabase Deployment Guide

## ✅ Your Setup: Vercel + Supabase PostgreSQL

Perfect choice! This combination gives you:

- **Vercel**: Best-in-class frontend/serverless hosting
- **Supabase**: Free PostgreSQL with 500MB storage + real-time features

## 🔧 Required Environment Variables in Vercel

### **Method 1: Supabase Connection String (Recommended)**

Go to your **Vercel Dashboard → Project → Settings → Environment Variables** and add:

```env
# Core Settings
NODE_ENV=production
USE_POSTGRES=true
JWT_SECRET=your-super-secure-256-bit-secret-key

# Supabase Database (get from Supabase Dashboard → Settings → Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Optional: CORS settings
CORS_ORIGIN=*
PORT=3000
```

### **Method 2: Individual Database Settings (Alternative)**

```env
# Core Settings
NODE_ENV=production
USE_POSTGRES=true
JWT_SECRET=your-super-secure-256-bit-secret-key

# Supabase Database Details
DB_HOST=db.[YOUR-PROJECT-REF].supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=[YOUR-SUPABASE-PASSWORD]
DB_NAME=postgres
DB_SSL=true

# Optional
CORS_ORIGIN=*
PORT=3000
```

## 🔍 How to Get Supabase Connection Details

1. **Go to Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project**
3. **Go to Settings → Database**
4. **Copy the connection string** from "Connection String" section
5. **Replace `[YOUR-PASSWORD]` with your actual database password**

## 📋 Step-by-Step Deployment

### **Step 1: Set Environment Variables**

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable       | Value                       | Notes                   |
| -------------- | --------------------------- | ----------------------- |
| `NODE_ENV`     | `production`                | Required                |
| `USE_POSTGRES` | `true`                      | Enables PostgreSQL      |
| `JWT_SECRET`   | `your-secret-key`           | 256-bit random string   |
| `DATABASE_URL` | `postgresql://postgres:...` | From Supabase dashboard |

### **Step 2: Deploy Your App**

```bash
# From your project root
vercel --prod
```

### **Step 3: Run Database Migrations**

After deployment, run migrations once:

```bash
# Option A: Using Vercel CLI
vercel env pull .env.local
npm run migrate
npm run seed

# Option B: Using Supabase SQL Editor
# Go to Supabase Dashboard → SQL Editor
# Run the migration SQL files manually
```

### **Step 4: Test Your Deployment**

Visit your deployed app and check:

- ✅ App loads correctly
- ✅ Registration works
- ✅ Login works
- ✅ Database operations work

## 🛠️ Build Configuration (Already Fixed)

Your `vercel.json` is now optimized:

```json
{
  "version": 2,
  "name": "finflux",
  "buildCommand": "npm run vercel-build",
  "builds": [
    {
      "src": "webapi/src/server.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": "webapi/build/**",
        "maxLambdaSize": "10mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "webapi/src/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "webapi/src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "USE_POSTGRES": "true"
  },
  "functions": {
    "webapi/src/server.js": {
      "maxDuration": 30
    }
  }
}
```

## 🔧 Package.json Changes (Already Fixed)

Your build process is now safe for Vercel:

```json
{
  "scripts": {
    "vercel-build": "npm run build:client:unix",
    "postinstall": "npm run migrate:safe",
    "migrate:safe": "node scripts/migrate-safe.js"
  }
}
```

## 🗄️ Database Migration Strategy

### **Automatic (During Build)**

- ✅ Safe migration script runs during deployment
- ✅ Only runs if PostgreSQL is configured
- ✅ Handles errors gracefully
- ✅ Seeds initial data if database is empty

### **Manual (After Deployment)**

```bash
# If automatic migration fails, run manually:
vercel env pull .env.local
npm run migrate
npm run seed
```

## 🎯 Supabase Free Plan Limits

Your Supabase free plan includes:

- ✅ **500MB Database Storage** (plenty for personal finance app)
- ✅ **Unlimited API requests**
- ✅ **50MB file storage**
- ✅ **Real-time subscriptions** (can be used for live updates)
- ✅ **2 organizations**

Perfect for your FinFlux app! 🎉

## 🔍 Troubleshooting

### **Build Fails**

1. Check environment variables are set correctly
2. Verify Supabase connection string format
3. Check build logs in Vercel dashboard

### **Database Connection Fails**

1. Verify DATABASE_URL is correct
2. Check Supabase project is active
3. Ensure password is correct in connection string

### **Migrations Don't Run**

1. Run manually: `npm run migrate && npm run seed`
2. Use Supabase SQL Editor to run migration files
3. Check database permissions

### **Check Your Configuration**

After deployment, visit: `https://your-app.vercel.app/api/health`

Should return:

```json
{
  "status": "OK",
  "database": "PostgreSQL",
  "environment": "production"
}
```

## 🎉 Final Checklist

- [ ] Environment variables set in Vercel
- [ ] DATABASE_URL from Supabase dashboard
- [ ] JWT_SECRET is secure (256-bit)
- [ ] USE_POSTGRES=true
- [ ] App deployed successfully
- [ ] Database migrations completed
- [ ] Test registration/login works

## 🚀 Optional: Enable Real-time Features

Since you're using Supabase, you can later add real-time features:

```javascript
// Real-time transaction updates
const supabase = createClient(supabaseUrl, supabaseKey);

supabase
  .channel("transactions")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "transactions" },
    (payload) => {
      // Update UI in real-time
      console.log("Transaction updated:", payload);
    }
  )
  .subscribe();
```

Your FinFlux app is now ready for production with Vercel + Supabase! 🎉
