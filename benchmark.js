import handler from './api/mcp.js';
import { performance } from 'perf_hooks';

async function runBenchmark() {
    const iters = 10000;

    // Mock for GET request
    const mockReq = {
        method: "GET",
        headers: {
            authorization: ""
        }
    };

    let endCount = 0;
    const mockRes = {
        setHeader: () => {},
        write: () => {},
        end: () => { endCount++; }
    };

    const start = performance.now();
    for (let i = 0; i < iters; i++) {
        await handler(mockReq, mockRes);
    }
    const end = performance.now();

    console.log(`GET requests: ${iters} iterations took ${end - start} ms`);
    console.log(`Throughput: ${(iters / ((end - start) / 1000)).toFixed(2)} req/sec`);
}

runBenchmark();
