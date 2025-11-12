#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const knex = require('knex');
const config = require('../knexfile');

async function setupDatabase() {
  const environment = process.env.NODE_ENV || 'development';
  const usePostgreSQL = process.env.USE_POSTGRES === 'true';
  
  console.log('\n🚀 Setting up FinFlux Database...');
  console.log(`Environment: ${environment}`);
  console.log(`Database Type: ${usePostgreSQL ? 'PostgreSQL' : 'SQLite'}`);
  
  try {
    const db = knex(config[environment]);
    
    // Test connection
    console.log('\n📡 Testing database connection...');
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Run migrations
    console.log('\n📊 Running database migrations...');
    const [batchNo, migrations] = await db.migrate.latest();
    
    if (migrations.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Ran ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }
    
    // Run seeds
    console.log('\n🌱 Running database seeds...');
    const seeds = await db.seed.run();
    console.log(`✅ Ran ${seeds[0].length} seed files:`);
    seeds[0].forEach(seed => {
      console.log(`   - ${seed}`);
    });
    
    await db.destroy();
    console.log('\n🎉 Database setup completed successfully!');
    
    if (usePostgreSQL) {
      console.log('\n💡 PostgreSQL Tips:');
      console.log('   - Make sure PostgreSQL server is running');
      console.log('   - Database and user should exist before running migrations');
      console.log('   - Check connection settings in .env file');
    } else {
      console.log('\n💡 SQLite Tips:');
      console.log('   - Database file created automatically');
      console.log(`   - Located at: ${path.join(__dirname, '..', 'data', 'fin_tracker.db')}`);
      console.log('   - Perfect for development and small deployments');
    }
    
  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error(error.message);
    
    if (usePostgreSQL) {
      console.error('\n🔧 PostgreSQL Troubleshooting:');
      console.error('   1. Ensure PostgreSQL server is running');
      console.error('   2. Create database: createdb finflux_db');
      console.error('   3. Create user: createuser -P finflux_user');
      console.error('   4. Grant permissions: GRANT ALL ON DATABASE finflux_db TO finflux_user;');
      console.error('   5. Check environment variables in .env file');
    } else {
      console.error('\n🔧 SQLite Troubleshooting:');
      console.error('   1. Check write permissions for ./data directory');
      console.error('   2. Ensure sqlite3 package is installed');
      console.error('   3. Check available disk space');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;