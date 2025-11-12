#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_ENV = '.env.sqlite';
const POSTGRES_ENV = '.env.postgres';
const TARGET_ENV = '.env';

function showUsage() {
  console.log('\n🗄️  FinFlux Database Switcher');
  console.log('\nUsage: node scripts/switch-db.js [sqlite|postgres|status]');
  console.log('\nCommands:');
  console.log('  sqlite    - Switch to SQLite database');
  console.log('  postgres  - Switch to PostgreSQL database');
  console.log('  status    - Show current database configuration');
  console.log('\nExamples:');
  console.log('  npm run db:sqlite     # Switch to SQLite');
  console.log('  npm run db:postgres   # Switch to PostgreSQL');
  console.log('  npm run db:status     # Check current setup');
}

function getCurrentDbType() {
  if (!fs.existsSync(TARGET_ENV)) {
    return 'none';
  }
  
  const envContent = fs.readFileSync(TARGET_ENV, 'utf8');
  const usePostgres = envContent.includes('USE_POSTGRES=true');
  return usePostgres ? 'postgres' : 'sqlite';
}

function switchToSqlite() {
  console.log('\n🔄 Switching to SQLite database...');
  
  if (!fs.existsSync(SQLITE_ENV)) {
    console.error(`❌ ${SQLITE_ENV} not found!`);
    process.exit(1);
  }
  
  fs.copyFileSync(SQLITE_ENV, TARGET_ENV);
  console.log('✅ Switched to SQLite configuration');
  console.log('💡 SQLite database will be created automatically in ./data/');
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }
}

function switchToPostgres() {
  console.log('\n🔄 Switching to PostgreSQL database...');
  
  if (!fs.existsSync(POSTGRES_ENV)) {
    console.error(`❌ ${POSTGRES_ENV} not found!`);
    process.exit(1);
  }
  
  fs.copyFileSync(POSTGRES_ENV, TARGET_ENV);
  console.log('✅ Switched to PostgreSQL configuration');
  console.log('\n📋 Next steps:');
  console.log('   1. Make sure PostgreSQL server is running');
  console.log('   2. Create database: createdb finflux_db');
  console.log('   3. Create user: createuser -P finflux_user');
  console.log('   4. Run migrations: npm run migrate');
}

function showStatus() {
  const currentDb = getCurrentDbType();
  
  console.log('\n📊 Database Configuration Status');
  console.log('================================');
  
  if (currentDb === 'none') {
    console.log('❌ No database configuration found');
    console.log('💡 Run: npm run db:sqlite or npm run db:postgres');
    return;
  }
  
  console.log(`Current Database: ${currentDb.toUpperCase()}`);
  
  if (fs.existsSync(TARGET_ENV)) {
    const envContent = fs.readFileSync(TARGET_ENV, 'utf8');
    console.log('\nEnvironment Variables:');
    
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && ['NODE_ENV', 'USE_POSTGRES', 'DB_HOST', 'DB_NAME', 'DB_USER'].includes(key.trim())) {
          console.log(`   ${key.trim()}: ${value ? value.trim() : '(not set)'}`);
        }
      }
    });
  }
  
  // Check if database files exist
  if (currentDb === 'sqlite') {
    const dbPath = path.join(__dirname, '..', 'data', 'fin_tracker.db');
    const exists = fs.existsSync(dbPath);
    console.log(`\nSQLite Database: ${exists ? '✅ Exists' : '❌ Not found'}`);
    if (exists) {
      const stats = fs.statSync(dbPath);
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Modified: ${stats.mtime.toLocaleString()}`);
    }
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'sqlite':
    switchToSqlite();
    break;
  case 'postgres':
    switchToPostgres();
    break;
  case 'status':
    showStatus();
    break;
  default:
    showUsage();
    process.exit(1);
}

console.log('');