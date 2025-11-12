#!/usr/bin/env node

/**
 * Safe migration script for Vercel deployment
 * Only runs migrations if we're in a Vercel build environment
 * and using PostgreSQL
 */

require('dotenv').config();

async function safeMigrate() {
  // Only run migrations in Vercel build environment with PostgreSQL
  const isVercelBuild = process.env.VERCEL === '1';
  const usePostgres = process.env.USE_POSTGRES === 'true';
  
  console.log('🔍 Migration Safety Check:');
  console.log(`   Vercel Build: ${isVercelBuild ? 'Yes' : 'No'}`);
  console.log(`   Use PostgreSQL: ${usePostgres ? 'Yes' : 'No'}`);
  
  if (!isVercelBuild) {
    console.log('⏭️  Skipping migrations (not in Vercel build environment)');
    return;
  }
  
  if (!usePostgres) {
    console.log('⏭️  Skipping migrations (SQLite mode - migrations handled at runtime)');
    return;
  }
  
  // Check if we have database connection details
  const hasDbUrl = process.env.DATABASE_URL || (
    process.env.DB_HOST && 
    process.env.DB_USER && 
    process.env.DB_PASSWORD && 
    process.env.DB_NAME
  );
  
  if (!hasDbUrl) {
    console.log('⚠️  No database connection found - migrations will be handled manually');
    return;
  }
  
  try {
    console.log('🚀 Running PostgreSQL migrations...');
    
    const knex = require('knex');
    const config = require('../knexfile');
    const db = knex(config.production);
    
    // Test connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Run migrations
    const [batchNo, migrations] = await db.migrate.latest();
    
    if (migrations.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Applied ${migrations.length} migrations`);
    }
    
    // Run seeds only if tables are empty
    const userCount = await db('users').count('* as count').first();
    
    if (parseInt(userCount.count) === 0) {
      console.log('🌱 Seeding initial data...');
      await db.seed.run();
      console.log('✅ Database seeded successfully');
    } else {
      console.log('⏭️  Skipping seeds (data already exists)');
    }
    
    await db.destroy();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Don't fail the build for migration errors
    // The app will handle missing tables gracefully
    console.log('⚠️  Continuing build - migrations can be run manually later');
    console.log('   Manual migration: npm run migrate && npm run seed');
  }
}

safeMigrate();