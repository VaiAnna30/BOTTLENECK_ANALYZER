const request = require('supertest');
const app = require('../server'); 
const basicBenchmark = require('./datasets/basic_benchmark.json');

// Safely import the generated stress test dataset if it exists on disk
let massiveBenchmark = null;
try {
    massiveBenchmark = require('./datasets/stress_test.json');
} catch (e) {
    // Gracefully handle if the user hasn't generated the file yet
}

describe('C++ Dinic Engine Validation Protocol', () => {

    // --- TEST 1: FUNCTIONAL FLOW ACCURACY ---
    test('Should calculate correct Max Flow for Basic Benchmark', async () => {
        const response = await request(app)
            .post('/api/analyze')
            .send(basicBenchmark.payload);

        // Assert HTTP lifecycle success
        expect(response.status).toBe(200);
        
        // Assert mathematical calculation correctness
        expect(response.body.max_flow).toBe(basicBenchmark.expectedMaxFlow);
    });

    // --- TEST 2: MIN-CUT BOTTLENECK IDENTIFICATION ---
    test('Should identify the correct Min-Cut Bottleneck edges', async () => {
        const response = await request(app)
            .post('/api/analyze')
            .send(basicBenchmark.payload);

        expect(response.status).toBe(200);
        
        // Verify array lengths match perfectly
        expect(response.body.bottleneck.length).toBe(basicBenchmark.expectedBottleneck.length);

        // Perform order-agnostic structural comparison against expected dataset objects
        expect(response.body.bottleneck).toEqual(
            expect.arrayContaining(basicBenchmark.expectedBottleneck)
        );
    });

    // --- TEST 3: HIGH-VOLUME COMPUTATIONAL STRESS TEST ---
    if (massiveBenchmark) {
        test('Should survive a 5,000 Node Washington Layered Stress Test', async () => {
            const response = await request(app)
                .post('/api/analyze')
                .send(massiveBenchmark.payload);

            // Assert engine process exited normally (code 0) without memory bounds exhaustion
            expect(response.status).toBe(200);
            
            // Confirm the returned type is a clear integer value
            expect(typeof response.body.max_flow).toBe('number');
            expect(response.body.max_flow).toBeGreaterThan(0);
            
            console.log(`   📊 Stress Test Performance Log:`);
            console.log(`   - Graph Size: ${massiveBenchmark.payload.numNodes} nodes, ${massiveBenchmark.payload.numEdges} edges`);
            console.log(`   - Computed Network Capacity: ${response.body.max_flow} Gbps`);
        }, 15000); // 15 Second Extended Timeout window for execution and streaming
    } else {
        test.skip('Skipping Washington Stress Test (stress_test.json not found)', () => {});
    }
});