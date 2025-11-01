// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

// Set up test database
const knex = require('knex');
const config = require('../knexfile');

const db = knex(config.test);

beforeAll(async () => {
  // Run migrations
  await db.migrate.latest();
  
  // Run seeds if needed
  await db.seed.run();
});

afterAll(async () => {
  // Clean up
  await db.destroy();
});