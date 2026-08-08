import handler from './api/mcp.js';
import assert from 'assert';

async function testCORS() {
    console.log("Starting CORS tests...");

    // Setup dummy process env for tests
    process.env.ALLOWED_ORIGINS = "https://trusted.com, http://localhost:3000";

    const createMockRes = () => {
        const headers = {};
        return {
            setHeader: (key, value) => { headers[key.toLowerCase()] = value; },
            status: () => ({ end: () => {}, json: () => {} }),
            end: () => {},
            getHeaders: () => headers
        };
    };

    // Test 1: Trusted origin
    const req1 = { headers: { origin: "https://trusted.com" }, method: "OPTIONS" };
    const res1 = createMockRes();
    await handler(req1, res1);
    assert.strictEqual(res1.getHeaders()["access-control-allow-origin"], "https://trusted.com");
    console.log("Test 1 Passed: Trusted origin allowed");

    // Test 2: Another trusted origin
    const req2 = { headers: { origin: "http://localhost:3000" }, method: "OPTIONS" };
    const res2 = createMockRes();
    await handler(req2, res2);
    assert.strictEqual(res2.getHeaders()["access-control-allow-origin"], "http://localhost:3000");
    console.log("Test 2 Passed: Another trusted origin allowed");

    // Test 3: Untrusted origin
    const req3 = { headers: { origin: "https://evil.com" }, method: "OPTIONS" };
    const res3 = createMockRes();
    await handler(req3, res3);
    assert.strictEqual(res3.getHeaders()["access-control-allow-origin"], undefined);
    console.log("Test 3 Passed: Untrusted origin blocked");

    // Test 4: Missing origin
    const req4 = { headers: {}, method: "OPTIONS" };
    const res4 = createMockRes();
    await handler(req4, res4);
    assert.strictEqual(res4.getHeaders()["access-control-allow-origin"], undefined);
    console.log("Test 4 Passed: Missing origin handled correctly");

    console.log("All CORS tests passed!");
}

testCORS().catch(console.error);
