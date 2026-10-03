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
- Normal tickets received: 4
- Bot tickets received: 6
- Normal success rate: 4.00%
- Bot success rate: 3.00%
- Tickets allocated: 10
- Unique tickets: 10
- Duplicate tickets: No
- Overselling: No
- Throughput: 914.63 requests/sec
- Average latency: 240.23 ms
- Median latency: 242.50 ms
- Minimum latency: 222 ms
- Maximum latency: 271 ms

Failure reasons:

- No tickets available: 236
- User already has an active reservation: 54

## Test 4 - High Concurrency

- Normal users: 500 requests
- Bot users: 1000 requests
- Total requests: 1500
- Successful requests: 10
- Failed requests: 1490
- Normal tickets received: 1
- Bot tickets received: 9
- Normal success rate: 0.20%
- Bot success rate: 0.90%
- Tickets allocated: 10
- Unique tickets: 10
- Duplicate tickets: No
- Overselling: No
- Throughput: 1981.51 requests/sec
- Average latency: 599.96 ms
- Median latency: 614 ms
- Minimum latency: 453 ms
- Maximum latency: 625 ms

Failure reasons:

- No tickets available: 1409
- User already has an active reservation: 81

## Overall Safety Results

- Duplicate ticket allocation: Prevented
- Overselling: Prevented
- Ticket inventory consistency: Maintained
- Active duplicate reservation attempts: Rejected
- Automatic reservation expiry: Verified
