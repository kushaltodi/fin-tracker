# FinFlux Database Configuration

FinFlux supports both **SQLite** (for development) and **PostgreSQL** (for production) databases with easy switching between them.

## 🗄️ Database Types

### SQLite (Default)

- **Perfect for**: Development, testing, small deployments
- **Pros**: Zero configuration, file-based, easy backup
- **Cons**: Single-user, limited scalability
- **File location**: `./data/fin_tracker.db`

### PostgreSQL

- **Perfect for**: Production, multi-user environments
- **Pros**: ACID compliant, scalable, concurrent users
- **Cons**: Requires server setup and configuration
- **Hosting**: Vercel Postgres, Supabase, AWS RDS, etc.

## 🚀 Quick Start

### Option 1: SQLite (Recommended for Development)

```bash
cd webapi
npm run db:sqlite
npm start
```

### Option 2: PostgreSQL (Production Ready)

```bash
# 1. Setup PostgreSQL server and create database
createdb finflux_db
createuser -P finflux_user

# 2. Switch to PostgreSQL
cd webapi
npm run db:postgres

# 3. Edit .env file with your PostgreSQL credentials
# 4. Run migrations
npm run migrate && npm run seed

# 5. Start server
npm start
```

## 📋 Available Commands

### Database Switching

```bash
npm run db:sqlite       # Switch to SQLite + setup
npm run db:postgres     # Switch to PostgreSQL
npm run db:status       # Show current database info
```

### Manual Setup

```bash
npm run migrate         # Run migrations
npm run seed           # Run seeds
npm run db:setup       # Run both migrations and seeds
```

### Environment-Specific

```bash
npm run dev:sqlite      # Start with SQLite
npm run dev:postgres    # Start with PostgreSQL
npm run migrate:sqlite  # Migrate SQLite only
npm run migrate:postgres # Migrate PostgreSQL only
```

## ⚙️ Configuration Files

### `.env.sqlite` (SQLite Configuration)

```env
NODE_ENV=development
USE_POSTGRES=false
JWT_SECRET=your-jwt-secret
PORT=3000
```

### `.env.postgres` (PostgreSQL Configuration)

```env
NODE_ENV=development
USE_POSTGRES=true
DB_HOST=localhost
DB_PORT=5432
DB_USER=finflux_user
DB_PASSWORD=finflux_password
DB_NAME=finflux_db
JWT_SECRET=your-jwt-secret
PORT=3000
```

## 🔧 PostgreSQL Setup

### Local Development

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PostgreSQL (Windows)
# Download from: https://www.postgresql.org/download/windows/
```

### Create Database and User

```sql
-- Connect to PostgreSQL
psql postgres

-- Create database
CREATE DATABASE finflux_db;

-- Create user
CREATE USER finflux_user WITH PASSWORD 'finflux_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE finflux_db TO finflux_user;
ALTER USER finflux_user CREATEDB;

-- Exit
\q
```

### Production (Vercel/Heroku)

```bash
# Set environment variables in your hosting platform:
NODE_ENV=production
USE_POSTGRES=true
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=production-secret-key
```

## 🏗️ Migration Files

Both databases use the same migration files located in:

```
src/database/migrations/
├── 001_create_users.js
├── 002_create_accounts.js
├── 003_create_categories.js
├── 004_create_transactions.js
└── 005_create_portfolio.js
```

## 🌱 Seed Data

Default categories and sample data:

```
src/database/seeds/
├── 001_categories.js
└── 002_sample_data.js
```

## 🚀 Deployment Guide

### SQLite Deployment (Vercel/Simple)

- Database included in deployment bundle
- Perfect for MVP/small applications
- Automatic backup with git commits

### PostgreSQL Deployment (Scalable)

- Use managed PostgreSQL services:
  - **Vercel Postgres** (Recommended)
  - **Supabase** (Free tier available)
  - **AWS RDS**
  - **Digital Ocean Databases**

### Vercel with PostgreSQL

```bash
# 1. Create Vercel Postgres database
vercel postgres create

# 2. Connect to your project
vercel env pull .env.local

# 3. Update vercel.json
{
  "env": {
    "USE_POSTGRES": "true",
    "DATABASE_URL": "@postgres_url"
  }
}
```

## 🔍 Troubleshooting

### SQLite Issues

```bash
# Check database status
npm run db:status

# Reset database
rm data/fin_tracker.db
npm run db:sqlite
```

### PostgreSQL Issues

```bash
# Test connection
psql -h localhost -U finflux_user -d finflux_db

# Check logs
npm run db:status

# Reset migrations
npm run migrate:rollback
npm run migrate:postgres
```

### Common Errors

**"relation does not exist"**

- Run migrations: `npm run migrate`

**"password authentication failed"**

- Check `.env` credentials
- Verify user exists: `psql -l`

**"database does not exist"**

- Create database: `createdb finflux_db`

## 📊 Database Schema

The application uses the same schema for both databases:

- **users** - User accounts and authentication
- **accounts** - Financial accounts (bank, credit, etc.)
- **categories** - Transaction categories
- **transactions** - Financial transactions
- **securities** - Investment securities
- **stock_trades** - Portfolio transactions

## 🔄 Switching Between Databases

You can switch databases anytime during development:

```bash
# Currently using SQLite, switch to PostgreSQL
npm run db:status          # Check current setup
npm run db:postgres        # Switch to PostgreSQL
npm run migrate && npm run seed

# Switch back to SQLite
npm run db:sqlite          # Automatically migrates and seeds
```

The switch preserves your data in each database, so you can test both configurations without losing work.
