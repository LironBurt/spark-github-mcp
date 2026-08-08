import test from 'node:test';
import assert from 'node:assert';
import handler from './callback.js';

test('handler returns 400 when missing authorization code', async () => {
  const req = {
    method: 'GET',
    query: {} // no code provided
  };

  let statusCode = null;
  let responseData = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    }
  };

  await handler(req, res);

  assert.strictEqual(statusCode, 400);
  assert.deepStrictEqual(responseData, { error: 'Missing authorization code' });
});
