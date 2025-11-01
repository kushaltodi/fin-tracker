const request = require('supertest');
const app = require('../src/server');
const db = require('../src/database/connection');

describe('Health Check', () => {
  afterAll(async () => {
    await db.destroy();
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });
});