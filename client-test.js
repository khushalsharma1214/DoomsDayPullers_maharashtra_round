const crypto = require('crypto');

async function simulateLegitimateUser() {
    console.log("1. Requesting challenge from server...");
    const challengeRes = await fetch('http://localhost:3000/api/queue/challenge');
    const { challenge } = await challengeRes.json();
    console.log(`Received challenge: ${challenge}`);

    console.log("\n2. Solving Proof of Work (Finding nonce)...");
    let nonce = 0;
    let hash = '';
    const startTime = Date.now();
    
    // The browser loop to find a hash starting with "000"
    while (!hash.startsWith('000')) {
        nonce++;
        hash = crypto.createHash('sha256').update(challenge + nonce).digest('hex');
    }
    
    console.log(`Solved in ${Date.now() - startTime}ms!`);
    console.log(`Nonce: ${nonce} -> Hash: ${hash}`);

    console.log("\n3. Submitting valid request to join queue...");
    const joinRes = await fetch('http://localhost:3000/api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, nonce: nonce.toString() })
    });

    const result = await joinRes.json();
    console.log("Server Response:", result);
}

simulateLegitimateUser();