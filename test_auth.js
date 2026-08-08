import handler from './api/mcp.js';
import assert from 'assert';

async function mockReqRes(headers) {
    const req = {
        method: 'POST',
        headers: headers,
        body: {
            method: 'initialize',
            id: 1,
            params: {}
        }
    };

    const res = {
        statusCode: null,
        jsonData: null,
        endCalled: false,

        setHeader: function(name, value) {
            // Mock
        },
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.jsonData = data;
            return this;
        },
        end: function() {
            this.endCalled = true;
            return this;
        }
    };

    await handler(req, res);

    return res;
}

async function runTests() {
    try {
        console.log('Test 1: Request with NO authorization header');
        let res1 = await mockReqRes({});
        assert.strictEqual(res1.statusCode, 401);
        assert.deepStrictEqual(res1.jsonData, { error: 'Unauthorized' });
        console.log('✅ Test 1 Passed');

        console.log('Test 2: Request with INVALID authorization header format');
        let res2 = await mockReqRes({ authorization: 'InvalidToken' });
        assert.strictEqual(res2.statusCode, 401);
        assert.deepStrictEqual(res2.jsonData, { error: 'Unauthorized' });
        console.log('✅ Test 2 Passed');

        console.log('Test 3: Request with VALID authorization header');
        let res3 = await mockReqRes({ authorization: 'Bearer some_valid_token' });
        assert.strictEqual(res3.statusCode, 200);
        assert.deepStrictEqual(res3.jsonData.result.serverInfo.name, 'spark-github-mcp');
        console.log('✅ Test 3 Passed');

        console.log('All tests passed successfully!');
    } catch (e) {
        console.error('❌ Test failed:', e);
        process.exit(1);
    }
}

runTests();
