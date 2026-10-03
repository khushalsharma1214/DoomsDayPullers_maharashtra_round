const http = require('http');

const TOTAL_REQUESTS = 100;
const CONCURRENCY = 10;

let completed = 0;
let blockedCount = 0;

async function sendRequest() {
    const data = JSON.stringify({
        userId: `bot_user_${Math.random()}`,
        nonce: 'fake_nonce',
        clientHash: 'invalid_hash_to_simulate_bot'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/drop/buy-seat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            if (res.statusCode === 403) {
                blockedCount++;
            }
            res.on('data', () => {}); 
            res.on('end', () => {
                completed++;
                resolve();
            });
        });

        req.on('error', () => {
            completed++;
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function runLoadTest() {
    console.log('🚀 Starting adversarial bot load test...');
    const startTime = Date.now();

    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
        const batch = [];
        for (let j = 0; j < CONCURRENCY && (i + j) < TOTAL_REQUESTS; j++) {
            batch.push(sendRequest());
        }
        await Promise.all(batch);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n--- Test Results ---`);
    console.log(`Total Requests Sent: ${TOTAL_REQUESTS}`);
    console.log(`Time Taken: ${duration}s`);
    console.log(`🛡️ Bots Successfully Blocked (403): ${blockedCount}`);
}

runLoadTest();