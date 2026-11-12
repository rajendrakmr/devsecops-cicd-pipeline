const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('GET /api/greet/:name', () => {
  it('greets the user', async () => {
    const res = await request(app).get('/api/greet/Rajendra');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Hello, Rajendra!');
  });

  it('sanitizes unsafe input', async () => {
    const res = await request(app).get('/api/greet/' + encodeURIComponent('<script>x</script>'));
    expect(res.body.message).not.toMatch(/[<>]/);
  });
});
