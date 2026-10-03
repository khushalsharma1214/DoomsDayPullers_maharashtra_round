const http = require('http');
const crypto = require('crypto');

function makeRequest(path, data) {
    return new Promise((resolve) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.write(payload);
        req.end();
    });
}

function makeGet(path) {
    return new Promise((resolve) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
    });
}

async function runTests() {
    console.log('🧪 Running End-to-End System Tests...\n');

    // Test 1: Simulate a Bot
    console.log('1️⃣ Testing Bot Attack Flow...');
    const botResponse = await makeRequest('/api/drop/buy-seat', {
        userId: 'bot_123',
        nonce: 'fake_nonce',
        clientHash: 'invalid_hash'
    });
    console.log(`Status: ${botResponse.status} (Expected: 403)`);
    console.log(`Response: ${botResponse.body}\n`);

    // Test 2: Simulate a Legitimate User
    console.log('2️⃣ Testing Legitimate User Flow...');
    
    const challengeRes = await makeGet('/api/drop/challenge');
    const challengeNonce = challengeRes.body.nonce;
    const difficulty = challengeRes.body.difficulty || 3;

    if (!challengeNonce) {
        console.log('❌ Error: Could not retrieve nonce from challenge endpoint.');
        return;
    }

    console.log(`Successfully fetched Nonce: ${challengeNonce}`);

    // Solve the puzzle using only nonce and counter
    let solvedHash = '';
    let counter = 0;
    const prefix = '0'.repeat(difficulty);

    while (true) {
        solvedHash = crypto.createHash('sha256').update(`${challengeNonce}${counter}`).digest('hex');
        if (solvedHash.startsWith(prefix)) {
            break;
        }
        counter++;
    }
    console.log(`Puzzle Solved! Hash: ${solvedHash}`);

    // Send purchase request with a unique user ID to prevent 409 duplicate conflicts
    const uniqueUserId = `user_${Date.now()}`;
    const userResponse = await makeRequest('/api/drop/buy-seat', {
        userId: uniqueUserId,
        nonce: challengeNonce,
        clientHash: solvedHash
    });
    console.log(`Status: ${userResponse.status} (Expected: 200)`);
    console.log(`Response: ${userResponse.body}\n`);

    console.log('✅ All tests completed!');
}

runTests();