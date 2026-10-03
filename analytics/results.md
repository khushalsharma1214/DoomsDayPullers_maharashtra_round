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



\## Test 5 - 50,000 User Stress Test



\### Configuration



\- Event: Fair Drop 500 Cricket Tickets Stress Test

\- Total requests: 50,000

\- Concurrent requests: 1,000

\- Bot-like traffic: 20%

\- Reservation window: 30 minutes

\- Available tickets: 500



\### Results



\- Successful requests: 500

\- Failed requests: 49,500

\- Tickets allocated: 500

\- Unique tickets: 500

\- Duplicate tickets: No

\- Overselling: No

\- Normal tickets received: 399

\- Bot-like tickets received: 101

\- Normal success rate: 1.00%

\- Bot-like success rate: 1.01%

\- Throughput: 80.87 requests/sec

\- Average latency: 7402.92 ms

\- Median latency: 8054.25 ms

\- Minimum latency: 992.54 ms

\- Maximum latency: 16644.79 ms



Failure reasons:



\- No seats available: 49,500



\### Historical 50,000 Request Run



An earlier 50,000-request run used a 5-minute reservation window.



That run produced:



\- 50,000 requests

\- 1,000 successful requests

\- 49,000 failed requests

\- 1,000 allocations

\- 500 unique seats

\- Duplicate allocation reported: Yes



The duplicate result was caused by reservations expiring and seats becoming available again while the approximately 9.6-minute stress test was still running. It therefore represents seat reuse across different reservation periods, rather than two users simultaneously owning the same seat.



The final 50,000-request test used a 30-minute reservation window to prevent this reuse during the test. It allocated exactly 500 unique seats and completed with no duplicate allocation or overselling.



\## Same-User Concurrency Test



A separate concurrency test sent 50 simultaneous reservation requests using the same user ID.



Results:



\- Successful requests: 1

\- Rejected requests: 49

\- Unexpected errors: 0

\- Active reservations for the user: 1



This verifies that simultaneous attempts by the same user cannot create multiple active reservations.



\## Overall Safety Results



\- Duplicate ticket allocation: Prevented

\- Overselling: Prevented

\- Ticket inventory consistency: Maintained

\- Active duplicate reservation attempts: Rejected

\- Database-level active-reservation protection: Enabled

\- Automatic reservation expiry: Verified

\- High-concurrency allocation: Stress tested



\## Interpretation



The allocation service successfully maintained inventory integrity during the final 50,000-request local stress test. All 500 available tickets were allocated exactly once during the controlled test window.



The traffic simulator distinguishes normal and bot-like generated traffic for analysis. Actual bot detection and classification are handled by the anti-abuse component.



The 50,000-request test is a local stress test and should not be interpreted as a production capacity benchmark. The measured throughput and latency depend on the local machine, network stack, PostgreSQL instance, and test configuration.



Fairness should be evaluated again after integration with the fair queue, session handling, and anti-bot components.

