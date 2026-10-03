const EVENT_ID = 1;

const NORMAL_USERS = 100;
const BOT_USERS = 20;

const NORMAL_ATTEMPTS = 1;
const BOT_ATTEMPTS = 10;

interface RequestJob {
    userId: number;
    type: "NORMAL" | "BOT";
}

interface Result {
    userId: number;
    type: "NORMAL" | "BOT";
    status: number;
    success: boolean;
    seatNumber: string | null;
    message: string | null;
    latency: number;
}

/*
TEST MODES

1 = Baseline
2 = Bot Flood
3 = Randomized Flash Crowd
4 = High Concurrency
*/

const TEST_MODE =
    Number(process.argv[2]) || 3;

function shuffle<T>(array: T[]): T[] {

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}

async function sendRequest(
    job: RequestJob
): Promise<Result> {

    const startTime = Date.now();

    try {

        const response = await fetch(
            "http://localhost:3000/api/purchase/reserve",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    eventId: EVENT_ID,
                    userId: job.userId
                })
            }
        );

        const data =
            await response.json();

        return {

            userId: job.userId,

            type: job.type,

            status: response.status,

            success: data.success,

            seatNumber:
                data.seatNumber ?? null,

            message:
                data.message ?? null,

            latency:
                Date.now() - startTime
        };

    } catch {

        return {

            userId: job.userId,

            type: job.type,

            status: 0,

            success: false,

            seatNumber: null,

            message: "Request failed",

            latency:
                Date.now() - startTime
        };
    }
}

function average(
    values: number[]
) {

    if (values.length === 0) {
        return 0;
    }

    return (
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / values.length
    );
}

function median(
    values: number[]
) {

    if (values.length === 0) {
        return 0;
    }

    const sorted =
        [...values].sort(
            (a, b) => a - b
        );

    const middle =
        Math.floor(
            sorted.length / 2
        );

    if (
        sorted.length % 2 === 0
    ) {

        return (
            sorted[middle - 1] +
            sorted[middle]
        ) / 2;
    }

    return sorted[middle];
}

function createJobs(): RequestJob[] {

    const jobs: RequestJob[] = [];

    /*
    BASELINE

    100 normal users,
    one request each.
    */

    if (TEST_MODE === 1) {

        for (
            let userId = 1;
            userId <= NORMAL_USERS;
            userId++
        ) {

            jobs.push({
                userId,
                type: "NORMAL"
            });
        }
    }

    /*
    BOT FLOOD

    Normal users:
    100 requests

    Bots:
    20 users × 10 requests
    */

    else if (TEST_MODE === 2) {

        for (
            let userId = 1;
            userId <= NORMAL_USERS;
            userId++
        ) {

            jobs.push({
                userId,
                type: "NORMAL"
            });
        }

        for (
            let i = 1;
            i <= BOT_USERS;
            i++
        ) {

            const userId =
                1000 + i;

            for (
                let attempt = 0;
                attempt < BOT_ATTEMPTS;
                attempt++
            ) {

                jobs.push({
                    userId,
                    type: "BOT"
                });
            }
        }
    }

    /*
    RANDOMIZED FLASH CROWD

    Same traffic as bot flood,
    but request order is randomized.
    */

    else if (TEST_MODE === 3) {

        for (
            let userId = 1;
            userId <= NORMAL_USERS;
            userId++
        ) {

            jobs.push({
                userId,
                type: "NORMAL"
            });
        }

        for (
            let i = 1;
            i <= BOT_USERS;
            i++
        ) {

            const userId =
                1000 + i;

            for (
                let attempt = 0;
                attempt < BOT_ATTEMPTS;
                attempt++
            ) {

                jobs.push({
                    userId,
                    type: "BOT"
                });
            }
        }

        return shuffle(jobs);
    }

    /*
    HIGH CONCURRENCY

    500 normal users +
    100 bot users × 10 requests.
    */

    else if (TEST_MODE === 4) {

        for (
            let userId = 1;
            userId <= 500;
            userId++
        ) {

            jobs.push({
                userId,
                type: "NORMAL"
            });
        }

        for (
            let i = 1;
            i <= 100;
            i++
        ) {

            const userId =
                1000 + i;

            for (
                let attempt = 0;
                attempt < 10;
                attempt++
            ) {

                jobs.push({
                    userId,
                    type: "BOT"
                });
            }
        }

        return shuffle(jobs);
    }

    return jobs;
}

async function runSimulation() {

    console.log(
        "=========================================="
    );

    console.log(
        "       FAIR DROP CRICKET TICKET"
    );

    console.log(
        "           TRAFFIC SIMULATOR"
    );

    console.log(
        "=========================================="
    );

    const modeNames: Record<number, string> = {

        1: "BASELINE",

        2: "BOT FLOOD",

        3: "RANDOMIZED FLASH CROWD",

        4: "HIGH CONCURRENCY"
    };

    console.log(
        `Test mode: ${
            modeNames[TEST_MODE] ??
            "UNKNOWN"
        }`
    );

    const jobs =
        createJobs();

    const normalJobs =
        jobs.filter(
            job =>
                job.type === "NORMAL"
        );

    const botJobs =
        jobs.filter(
            job =>
                job.type === "BOT"
        );

    console.log(
        `Normal requests: ${
            normalJobs.length
        }`
    );

    console.log(
        `Bot requests: ${
            botJobs.length
        }`
    );

    console.log(
        `Total requests: ${
            jobs.length
        }`
    );

    console.log(
        "\nSending requests...\n"
    );

    const simulationStart =
        Date.now();

    /*
    All requests start concurrently.
    */

    const results =
        await Promise.all(
            jobs.map(
                job =>
                    sendRequest(job)
            )
        );

    const totalTime =
        Date.now() -
        simulationStart;

    // -------------------------
    // GROUP RESULTS
    // -------------------------

    const normalResults =
        results.filter(
            result =>
                result.type ===
                "NORMAL"
        );

    const botResults =
        results.filter(
            result =>
                result.type ===
                "BOT"
        );

    const normalSuccess =
        normalResults.filter(
            result =>
                result.success
        );

    const botSuccess =
        botResults.filter(
            result =>
                result.success
        );

    // -------------------------
    // TICKETS
    // -------------------------

    const tickets =
        results
            .filter(
                result =>
                    result.success
            )
            .map(
                result =>
                    result.seatNumber
            )
            .filter(Boolean) as string[];

    const uniqueTickets =
        new Set(tickets);

    // -------------------------
    // LATENCY
    // -------------------------

    const allLatencies =
        results.map(
            result =>
                result.latency
        );

    const normalLatencies =
        normalResults.map(
            result =>
                result.latency
        );

    const botLatencies =
        botResults.map(
            result =>
                result.latency
        );

    // -------------------------
    // FAILURE REASONS
    // -------------------------

    const failures =
        new Map<string, number>();

    for (
        const result of results
    ) {

        if (!result.success) {

            const reason =
                result.message ??
                "Unknown";

            failures.set(
                reason,
                (
                    failures.get(
                        reason
                    ) ?? 0
                ) + 1
            );
        }
    }

    const successful =
        results.filter(
            result =>
                result.success
        ).length;

    const failed =
        results.length -
        successful;

    const throughput =
        (
            results.length /
            totalTime
        ) * 1000;

    // -------------------------
    // REPORT
    // -------------------------

    console.log(
        "\n========== TRAFFIC =========="
    );

    console.log(
        `Total requests: ${
            results.length
        }`
    );

    console.log(
        `Successful: ${
            successful
        }`
    );

    console.log(
        `Failed: ${
            failed
        }`
    );

    console.log(
        `Simulation time: ${
            totalTime
        } ms`
    );

    console.log(
        `Throughput: ${
            throughput.toFixed(2)
        } requests/sec`
    );

    // -------------------------
    // NORMAL
    // -------------------------

    console.log(
        "\n========== NORMAL USERS =========="
    );

    console.log(
        `Requests: ${
            normalResults.length
        }`
    );

    console.log(
        `Tickets received: ${
            normalSuccess.length
        }`
    );

    console.log(
        `Success rate: ${
            (
                normalSuccess.length /
                normalResults.length *
                100
            ).toFixed(2)
        }%`
    );

    console.log(
        `Average latency: ${
            average(
                normalLatencies
            ).toFixed(2)
        } ms`
    );

    console.log(
        `Median latency: ${
            median(
                normalLatencies
            ).toFixed(2)
        } ms`
    );

    // -------------------------
    // BOTS
    // -------------------------

    console.log(
        "\n========== BOT USERS =========="
    );

    console.log(
        `Requests: ${
            botResults.length
        }`
    );

    console.log(
        `Tickets received: ${
            botSuccess.length
        }`
    );

    console.log(
        `Success rate: ${
            botResults.length === 0
                ? "N/A"
                : (
                    botSuccess.length /
                    botResults.length *
                    100
                ).toFixed(2) + "%"
        }`
    );

    console.log(
        `Average latency: ${
            average(
                botLatencies
            ).toFixed(2)
        } ms`
    );

    console.log(
        `Median latency: ${
            median(
                botLatencies
            ).toFixed(2)
        } ms`
    );

    // -------------------------
    // TICKET SAFETY
    // -------------------------

    console.log(
        "\n========== TICKET SAFETY =========="
    );

    console.log(
        `Tickets allocated: ${
            tickets.length
        }`
    );

    console.log(
        `Unique tickets: ${
            uniqueTickets.size
        }`
    );

    console.log(
        `Duplicate tickets detected: ${
            tickets.length !==
            uniqueTickets.size
        }`
    );

    console.log(
        `Overselling detected: ${
            tickets.length > 10
        }`
    );

    // -------------------------
    // LATENCY
    // -------------------------

    console.log(
        "\n========== LATENCY =========="
    );

    console.log(
        `Average: ${
            average(
                allLatencies
            ).toFixed(2)
        } ms`
    );

    console.log(
        `Median: ${
            median(
                allLatencies
            ).toFixed(2)
        } ms`
    );

    console.log(
        `Minimum: ${
            Math.min(
                ...allLatencies
            )
        } ms`
    );

    console.log(
        `Maximum: ${
            Math.max(
                ...allLatencies
            )
        } ms`
    );

    // -------------------------
    // FAILURE REASONS
    // -------------------------

    console.log(
        "\n========== FAILURE REASONS =========="
    );

    for (
        const [reason, count]
        of failures
    ) {

        console.log(
            `${reason}: ${count}`
        );
    }

    console.log(
        "\n=========================================="
    );
}

runSimulation();