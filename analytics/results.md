# Fair Drop Cricket Ticket - Traffic and Allocation Analytics



## Test 1 - Baseline Traffic



- Total requests: 60

- Successful requests: 10

- Failed requests: 50

- Tickets allocated: 10

- Unique tickets: 10

- Duplicate tickets: No

- Overselling: No

- Average latency: 49.80 ms

- Median latency: 22.50 ms

- Throughput: 255.32 requests/sec



## Test 2 - Bot Flood



- Normal users: 100 requests

- Bot users: 200 requests

- Total requests: 300

- Successful requests: 10

- Failed requests: 290

- Normal tickets received: 10

- Bot tickets received: 0

- Tickets allocated: 10

- Unique tickets: 10

- Duplicate tickets: No

- Overselling: No

- Throughput: 847.46 requests/sec

- Average latency: 73.64 ms

- Median latency: 14 ms



## Test 3 - Randomized Flash Crowd



- Normal users: 100 requests

- Bot users: 200 requests

- Total requests: 300

- Successful requests: 10

- Failed requests: 290

- Normal tickets received: 3

- Bot tickets received: 7

- Normal success rate: 3.00%

- Bot success rate: 3.50%

- Tickets allocated: 10

- Unique tickets: 10

- Duplicate tickets: No

- Overselling: No

- Throughput: 787.40 requests/sec

- Average latency: 294.07 ms

- Median latency: 294.00 ms

- Minimum latency: 259 ms

- Maximum latency: 320 ms



Failure reasons:

- No tickets available: 217

- User already has an active reservation: 73



## Test 4 - High Concurrency



- Normal users: 500 requests

- Bot users: 1000 requests

- Total requests: 1500

- Successful requests: 10

- Failed requests: 1490

- Normal tickets received: 5

- Bot tickets received: 5

- Normal success rate: 1.00%

- Bot success rate: 0.50%

- Tickets allocated: 10

- Unique tickets: 10

- Duplicate tickets: No

- Overselling: No

- Throughput: 964.01 requests/sec

- Average latency: 1191.91 ms

- Median latency: 1231.50 ms

- Minimum latency: 784 ms

- Maximum latency: 1378 ms



Failure reasons:

- No tickets available: 1445

- User already has an active reservation: 45



## Overall Safety Results



- Duplicate ticket allocation: Prevented

- Overselling: Prevented

- Ticket inventory consistency: Maintained

- Active duplicate reservation attempts: Rejected

- Automatic reservation expiry: Verified

