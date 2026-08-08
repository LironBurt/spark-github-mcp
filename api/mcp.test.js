import test from 'node:test';
import assert from 'node:assert';
import handler from './mcp.js';

test('error path returns 500 and includes request id if available', async () => {
  const req = {
    method: 'POST',
    headers: {},
    body: {
      id: 'test-id-123',
      method: 'tools/call',
      params: {
        name: 'list_repositories'
      }
    }
  };

  let statusCode, jsonResponse;
  const res = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          jsonResponse = data;
        },
        end: () => {}
      };
    }
  };

  await handler(req, res);

  assert.strictEqual(statusCode, 500);
  assert.strictEqual(jsonResponse.jsonrpc, '2.0');
  assert.strictEqual(jsonResponse.id, 'test-id-123');
  assert.strictEqual(jsonResponse.error.code, -32603);
  assert.ok(jsonResponse.error.message);
});

test('error path returns null id if parsing fails', async () => {
  const req = {
    method: 'POST',
    headers: {},
    body: '{ invalid json'
  };

  let statusCode, jsonResponse;
  const res = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          jsonResponse = data;
        },
        end: () => {}
      };
    }
  };

  await handler(req, res);

  assert.strictEqual(statusCode, 500);
  assert.strictEqual(jsonResponse.jsonrpc, '2.0');
  assert.strictEqual(jsonResponse.id, null);
  assert.strictEqual(jsonResponse.error.code, -32603);
  assert.ok(jsonResponse.error.message.includes('JSON'));
});
