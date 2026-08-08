import handler from './api/mcp.js';
import { performance } from 'perf_hooks';

async function runBenchmark() {
    const iters = 50000;

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

    // Warmup
    for (let i = 0; i < 5000; i++) {
        await handler(mockReq, mockRes);
    }

    let totalTime = 0;
    const runs = 5;
    for (let r = 0; r < runs; r++) {
        const start = performance.now();
        for (let i = 0; i < iters; i++) {
            await handler(mockReq, mockRes);
        }
        const end = performance.now();
        totalTime += (end - start);
    }

    const avgTime = totalTime / runs;
    console.log(`GET requests: ${iters} iterations took ${avgTime.toFixed(2)} ms (avg of ${runs} runs)`);
    console.log(`Throughput: ${(iters / (avgTime / 1000)).toFixed(2)} req/sec`);
}

runBenchmark();
