import request from 'supertest';
import app from '../server.js';

describe('Server', () => {
  it('responds with Hello, World! on the root path', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Hello, World!');
  });

  it('returns 404 for undefined routes', async () => {
    const response = await request(app).get('/undefined-route');
    expect(response.status).toBe(404);
  });
});
