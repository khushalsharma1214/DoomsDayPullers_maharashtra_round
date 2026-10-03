\# Fair Drop Cricket Ticket - Traffic and Allocation Analytics



\## Test 1 - Baseline Traffic



\- Total requests: 60

\- Successful requests: 10

\- Failed requests: 50

\- Tickets allocated: 10

\- Unique tickets: 10

\- Duplicate tickets: No

\- Overselling: No

\- Average latency: 49.80 ms

\- Median latency: 22.50 ms

\- Throughput: 255.32 requests/sec



\## Test 2 - Bot Flood



\- Normal users: 100 requests

\- Bot users: 200 requests

\- Total requests: 300

\- Successful requests: 10

\- Failed requests: 290

\- Normal tickets received: 10

\- Bot tickets received: 0

\- Tickets allocated: 10

\- Unique tickets: 10

\- Duplicate tickets: No

\- Overselling: No

\- Throughput: 847.46 requests/sec

\- Average latency: 73.64 ms

\- Median latency: 14 ms



\## Test 3 - Randomized Flash Crowd



\- Normal users: 100 requests

\- Bot users: 200 requests

\- Total requests: 300

\- Successful requests: 10

\- Failed requests: 290

\- Normal tickets received: 4

\- Bot tickets received: 6

\- Normal success rate: 4.00%

\- Bot success rate: 3.00%

\- Tickets allocated: 10

\- Unique tickets: 10

\- Duplicate tickets: No

\- Overselling: No

\- Throughput: 914.63 requests/sec

\- Average latency: 240.23 ms

\- Median latency: 242.50 ms

\- Minimum latency: 222 ms

\- Maximum latency: 271 ms



Failure reasons:



\- No tickets available: 236

\- User already has an active reservation: 54



\## Test 4 - High Concurrency



\- Normal users: 500 requests

\- Bot users: 1000 requests

\- Total requests: 1500

\- Successful requests: 10

\- Failed requests: 1490

\- Normal tickets received: 3

\- Bot tickets received: 7

\- Normal success rate: 0.60%

\- Bot success rate: 0.70%

\- Tickets allocated: 10

\- Unique tickets: 10

\- Duplicate tickets: No

\- Overselling: No

\- Throughput: 1018.33 requests/sec

\- Average latency: 1146.68 ms

\- Median latency: 1167 ms

\- Minimum latency: 756 ms

\- Maximum latency: 1305 ms



Failure reasons:



\- No tickets available: 1427

\- User already has an active reservation: 63



\## Overall Safety Results



\- Duplicate ticket allocation: Prevented

\- Overselling: Prevented

\- Ticket inventory consistency: Maintained

\- Active duplicate reservation attempts: Rejected

\- Automatic reservation expiry: Verified

