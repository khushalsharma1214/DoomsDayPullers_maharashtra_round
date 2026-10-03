import asyncio
import sys
import time
import random
import csv
import os
from collections import Counter

import httpx


# ============================================================
# CONFIGURATION
# ============================================================

BASE_URL = "http://localhost:3000"
RESERVE_ENDPOINT = f"{BASE_URL}/api/purchase/reserve"

# Event 2 = 500-seat cricket ticket stress-test event.
EVENT_ID = 2

TOTAL_USERS = 1000
CONCURRENCY = 500

# Controlled traffic classification.
# Actual bot detection will come from Teammate 3.
BOT_PERCENTAGE = 20

# Reserved for the later repeated-attempt test.
BOT_ATTEMPTS = 5
NORMAL_ATTEMPTS = 1

REQUEST_TIMEOUT = 30.0

# Analytics output.
ANALYTICS_FILE = os.path.join(
    "analytics",
    "python_traffic_results.csv"
)


# ============================================================
# REQUEST RESULT
# ============================================================

class Result:

    def __init__(
        self,
        user_id: int,
        is_bot: bool,
        success: bool,
        seat_number: str | None,
        message: str,
        latency_ms: float,
        status_code: int,
    ):
        self.user_id = user_id
        self.is_bot = is_bot
        self.success = success
        self.seat_number = seat_number
        self.message = message
        self.latency_ms = latency_ms
        self.status_code = status_code


# ============================================================
# SINGLE REQUEST
# ============================================================

async def make_request(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    user_id: int,
    is_bot: bool,
) -> Result:

    async with semaphore:

        start = time.perf_counter()

        try:

            response = await client.post(
                RESERVE_ENDPOINT,
                json={
                    "eventId": EVENT_ID,
                    "userId": user_id,
                },
            )

            latency_ms = (
                time.perf_counter() - start
            ) * 1000

            try:
                data = response.json()
            except Exception:
                data = {}

            success = bool(
                data.get("success")
            )

            seat_number = data.get(
                "seatNumber"
            )

            message = data.get(
                "message",
                "unknown"
            )

            return Result(
                user_id=user_id,
                is_bot=is_bot,
                success=success,
                seat_number=seat_number,
                message=message,
                latency_ms=latency_ms,
                status_code=response.status_code,
            )

        except Exception as error:

            latency_ms = (
                time.perf_counter() - start
            ) * 1000

            return Result(
                user_id=user_id,
                is_bot=is_bot,
                success=False,
                seat_number=None,
                message=f"ERROR: {error}",
                latency_ms=latency_ms,
                status_code=0,
            )


# ============================================================
# GENERATE TRAFFIC
# ============================================================

def generate_requests(
    total_users: int,
    bot_percentage: int,
):

    requests = []

    bot_count = round(
        total_users
        * bot_percentage
        / 100
    )

    normal_count = (
        total_users
        - bot_count
    )

    # Normal users
    for i in range(normal_count):

        user_id = 100000 + i

        requests.append(
            (
                user_id,
                False,
            )
        )

    # Bot-like users
    for i in range(bot_count):

        user_id = 200000 + i

        requests.append(
            (
                user_id,
                True,
            )
        )

    random.shuffle(requests)

    return requests


# ============================================================
# SAVE ANALYTICS
# ============================================================

def save_analytics(
    total_requests,
    successful,
    failed,
    throughput,
    average_latency,
    median_latency,
    normal_successes,
    bot_successes,
    duplicate_allocation,
):

    os.makedirs(
        "analytics",
        exist_ok=True
    )

    file_exists = os.path.exists(
        ANALYTICS_FILE
    )

    with open(
        ANALYTICS_FILE,
        "a",
        newline="",
        encoding="utf-8",
    ) as file:

        writer = csv.writer(file)

        if not file_exists:

            writer.writerow([
                "Event ID",
                "Total Requests",
                "Successful",
                "Failed",
                "Throughput (req/s)",
                "Average Latency (ms)",
                "Median Latency (ms)",
                "Normal Tickets",
                "Bot-like Tickets",
                "Duplicate Allocation",
            ])

        writer.writerow([
            EVENT_ID,
            total_requests,
            len(successful),
            len(failed),
            round(throughput, 2),
            round(average_latency, 2),
            round(median_latency, 2),
            len(normal_successes),
            len(bot_successes),
            "YES"
            if duplicate_allocation
            else "NO",
        ])


# ============================================================
# RUN SIMULATION
# ============================================================

async def run_simulation(
    total_users: int,
    concurrency: int,
    bot_percentage: int,
):

    print()
    print("=" * 60)
    print("FAIR DROP PYTHON TRAFFIC SIMULATOR")
    print("=" * 60)

    print(
        f"Total users:       {total_users}"
    )

    print(
        f"Bot percentage:    {bot_percentage}%"
    )

    print(
        f"Concurrency limit: {concurrency}"
    )

    print(
        f"Event ID:          {EVENT_ID}"
    )

    print(
        f"Endpoint:          {RESERVE_ENDPOINT}"
    )

    requests = generate_requests(
        total_users,
        bot_percentage,
    )

    bot_count = sum(
        1
        for _, is_bot in requests
        if is_bot
    )

    normal_count = (
        len(requests)
        - bot_count
    )

    print(
        f"Normal users:      {normal_count}"
    )

    print(
        f"Bot-like users:    {bot_count}"
    )

    print()

    semaphore = asyncio.Semaphore(
        concurrency
    )

    timeout = httpx.Timeout(
        REQUEST_TIMEOUT
    )

    limits = httpx.Limits(
        max_connections=concurrency,
        max_keepalive_connections=concurrency,
    )

    results = []

    simulation_start = (
        time.perf_counter()
    )

    async with httpx.AsyncClient(
        timeout=timeout,
        limits=limits,
    ) as client:

        # ====================================================
        # BATCHED REQUEST EXECUTION
        # ====================================================

        batch_size = concurrency

        total_requests = len(requests)

        for start in range(
            0,
            total_requests,
            batch_size,
        ):

            batch = requests[
                start:start + batch_size
            ]

            tasks = [
                make_request(
                    client,
                    semaphore,
                    user_id,
                    is_bot,
                )
                for user_id, is_bot in batch
            ]

            batch_results = await asyncio.gather(
                *tasks
            )

            results.extend(
                batch_results
            )

            print(
                f"Completed "
                f"{len(results)}/"
                f"{total_requests} requests"
            )

    simulation_time = (
        time.perf_counter()
        - simulation_start
    )

    # ========================================================
    # ANALYSIS
    # ========================================================

    successful = [
        result
        for result in results
        if result.success
    ]

    failed = [
        result
        for result in results
        if not result.success
    ]

    normal_results = [
        result
        for result in results
        if not result.is_bot
    ]

    bot_results = [
        result
        for result in results
        if result.is_bot
    ]

    normal_successes = [
        result
        for result in normal_results
        if result.success
    ]

    bot_successes = [
        result
        for result in bot_results
        if result.success
    ]

    # ========================================================
    # LATENCY
    # ========================================================

    latencies = sorted(
        result.latency_ms
        for result in results
    )

    if latencies:

        average_latency = (
            sum(latencies)
            / len(latencies)
        )

        middle = len(latencies) // 2

        if len(latencies) % 2 == 0:

            median_latency = (
                latencies[middle - 1]
                + latencies[middle]
            ) / 2

        else:

            median_latency = (
                latencies[middle]
            )

        minimum_latency = min(
            latencies
        )

        maximum_latency = max(
            latencies
        )

    else:

        average_latency = 0
        median_latency = 0
        minimum_latency = 0
        maximum_latency = 0

    # ========================================================
    # THROUGHPUT
    # ========================================================

    if simulation_time > 0:

        throughput = (
            len(results)
            / simulation_time
        )

    else:

        throughput = 0

    # ========================================================
    # TICKET ANALYSIS
    # ========================================================

    allocated_seats = [
        result.seat_number
        for result in successful
        if result.seat_number
    ]

    unique_seats = set(
        allocated_seats
    )

    seat_counts = Counter(
        allocated_seats
    )

    duplicate_seats = [
        seat
        for seat, count
        in seat_counts.items()
        if count > 1
    ]

    duplicate_allocation = (
        len(duplicate_seats) > 0
    )

    # ========================================================
    # FAILURE ANALYSIS
    # ========================================================

    failure_reasons = Counter(
        result.message
        for result in failed
    )

    # ========================================================
    # SUCCESS RATES
    # ========================================================

    normal_success_rate = (
        len(normal_successes)
        / len(normal_results)
        * 100
        if normal_results
        else 0
    )

    bot_success_rate = (
        len(bot_successes)
        / len(bot_results)
        * 100
        if bot_results
        else 0
    )

    # ========================================================
    # OUTPUT
    # ========================================================

    print()
    print("=" * 60)
    print("RESULTS")
    print("=" * 60)

    print(
        f"Total requests:       "
        f"{len(results)}"
    )

    print(
        f"Successful requests:  "
        f"{len(successful)}"
    )

    print(
        f"Failed requests:      "
        f"{len(failed)}"
    )

    print()

    print(
        f"Normal tickets:       "
        f"{len(normal_successes)}"
    )

    print(
        f"Bot-like tickets:     "
        f"{len(bot_successes)}"
    )

    print(
        f"Normal success rate:  "
        f"{normal_success_rate:.2f}%"
    )

    print(
        f"Bot success rate:     "
        f"{bot_success_rate:.2f}%"
    )

    print()

    print(
        f"Tickets allocated:    "
        f"{len(allocated_seats)}"
    )

    print(
        f"Unique tickets:       "
        f"{len(unique_seats)}"
    )

    print(
        f"Duplicate allocation: "
        f"{'YES' if duplicate_allocation else 'NO'}"
    )

    print()

    print(
        f"Simulation time:      "
        f"{simulation_time:.3f} sec"
    )

    print(
        f"Throughput:           "
        f"{throughput:.2f} requests/sec"
    )

    print()

    print(
        f"Average latency:      "
        f"{average_latency:.2f} ms"
    )

    print(
        f"Median latency:       "
        f"{median_latency:.2f} ms"
    )

    print(
        f"Minimum latency:      "
        f"{minimum_latency:.2f} ms"
    )

    print(
        f"Maximum latency:      "
        f"{maximum_latency:.2f} ms"
    )

    print()

    print("Failure reasons:")

    if failure_reasons:

        for reason, count in (
            failure_reasons.most_common()
        ):

            print(
                f"  {reason}: {count}"
            )

    else:

        print("  None")

    # ========================================================
    # SAVE CSV
    # ========================================================

    save_analytics(
        total_requests=len(results),
        successful=successful,
        failed=failed,
        throughput=throughput,
        average_latency=average_latency,
        median_latency=median_latency,
        normal_successes=normal_successes,
        bot_successes=bot_successes,
        duplicate_allocation=duplicate_allocation,
    )

    print()
    print(
        f"Analytics saved to: "
        f"{ANALYTICS_FILE}"
    )

    # ========================================================
    # SAFETY CHECK
    # ========================================================

    print()
    print("=" * 60)
    print("SAFETY CHECK")
    print("=" * 60)

    print(
        "Duplicate allocation: "
        + (
            "FAILED"
            if duplicate_allocation
            else "PASSED"
        )
    )

    print(
        "Inventory consistency: "
        + (
            "PASSED"
            if len(allocated_seats)
            == len(unique_seats)
            else "FAILED"
        )
    )

    print("=" * 60)
    print()


# ============================================================
# COMMAND LINE
# ============================================================

def main():

    total_users = TOTAL_USERS
    concurrency = CONCURRENCY
    bot_percentage = BOT_PERCENTAGE

    if len(sys.argv) >= 2:

        total_users = int(
            sys.argv[1]
        )

    if len(sys.argv) >= 3:

        concurrency = int(
            sys.argv[2]
        )

    if len(sys.argv) >= 4:

        bot_percentage = int(
            sys.argv[3]
        )

    asyncio.run(
        run_simulation(
            total_users=total_users,
            concurrency=concurrency,
            bot_percentage=bot_percentage,
        )
    )


# ============================================================
# PROGRAM ENTRY
# ============================================================

if __name__ == "__main__":

    main()