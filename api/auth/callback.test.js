import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from './callback.js';

describe('Auth Callback API', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: 'GET',
      query: { code: 'test-code' }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 405 if method is not GET', async () => {
    req.method = 'POST';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
  });

  it('should return 400 if code is missing', async () => {
    req.query.code = undefined;
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing authorization code' });
  });

  it('should return 500 if environment variables are missing', async () => {
    delete process.env.GITHUB_CLIENT_ID;

    // Suppress console.error for missing variables
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });

    consoleSpy.mockRestore();
  });

  it('should return 500 when fetch throws an error', async () => {
    const error = new Error('Network error');
    global.fetch.mockRejectedValue(error);

    // Suppress console.error output during this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    expect(consoleSpy).toHaveBeenCalledWith('Error exchanging code for access token:', error);

    consoleSpy.mockRestore();
  });

  it('should return 400 if GitHub API returns an error', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'bad_verification_code', error_description: 'The code passed is incorrect or expired.' })
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'bad_verification_code',
      error_description: 'The code passed is incorrect or expired.'
    });
  });

  it('should return 200 and access token on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'gho_token',
        token_type: 'bearer',
        scope: 'repo'
      })
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Authentication successful. Please return to your MCP client.',
      access_token: 'gho_token',
      token_type: 'bearer',
      scope: 'repo'
    });
  });
});
