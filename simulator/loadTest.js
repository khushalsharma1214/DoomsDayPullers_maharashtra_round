const API_BASE_URL = "http://localhost:5000";

const MATCH_ID = 1;
const NUMBER_OF_USERS = 50000;
const TOTAL_SEATS = 500;

const JOIN_CONCURRENCY = 1000;
const STATUS_CONCURRENCY = 250;
const RESERVE_CONCURRENCY = 500;

const MAX_ADMISSION_WAIT_MS = 180000;
const STATUS_POLL_INTERVAL_MS = 5000;

const SIMULATOR_HEADERS = {
  "Content-Type": "application/json",
  "X-Simulator": "true"
};

const percentile = (values, p) => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const index =
    Math.ceil(
      (p / 100) * sorted.length
    ) - 1;

  return sorted[
    Math.max(0, index)
  ];
};

const formatMs = (value) => {
  return `${Math.round(value)} ms`;
};

const sleep = (ms) => {
  return new Promise(
    (resolve) => setTimeout(resolve, ms)
  );
};

const request = async (
  method,
  path,
  body = null,
  token = null
) => {
  const headers = {
    ...SIMULATOR_HEADERS
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const start = performance.now();

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers,
        body: body
          ? JSON.stringify(body)
          : undefined,
        signal:
          AbortSignal.timeout(30000)
      }
    );

    const elapsed =
      performance.now() - start;

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      elapsed
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      elapsed:
        performance.now() - start,
      error: error.message
    };
  }
};

const runPool = async (
  items,
  concurrency,
  worker,
  progressLabel = ""
) => {
  const results =
    new Array(items.length);

  let nextIndex = 0;
  let completed = 0;

  const workerLoop = async () => {
    while (true) {
      const index = nextIndex++;

      if (
        index >= items.length
      ) {
        return;
      }

      try {
        results[index] =
          await worker(
            items[index],
            index
          );
      } catch (error) {
        results[index] = {
          ok: false,
          status: 0,
          data: null,
          error: error.message
        };
      }

      completed++;

      if (
        progressLabel &&
        (
          completed === items.length ||
          completed % 5000 === 0
        )
      ) {
        console.log(
          `${progressLabel}: ${completed}/${items.length}`
        );
      }
    }
  };

  const workerCount =
    Math.min(
      concurrency,
      items.length
    );

  await Promise.all(
    Array.from(
      {
        length: workerCount
      },
      workerLoop
    )
  );

  return results;
};

const prepareUsers = async () => {
  console.log("");
  console.log(
    "1. Preparing 50,000 authenticated simulator users..."
  );

  const start =
    performance.now();

  const result =
    await request(
      "POST",
      "/api/simulator/prepare-users",
      {
        count:
          NUMBER_OF_USERS
      }
    );

  const elapsed =
    performance.now() - start;

  if (
    !result.ok ||
    !result.data?.users
  ) {
    console.error(
      "Failed to prepare simulator users."
    );

    console.error(
      result.data || result.error
    );

    process.exit(1);
  }

  const users =
    result.data.users.map(
      (user, index) => ({
        index:
          index + 1,

        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        token:
          user.token,

        queuePosition:
          null,

        queueEntryId:
          null
      })
    );

  console.log("");
  console.log(
    `Users prepared: ${users.length}/${NUMBER_OF_USERS}`
  );

  console.log(
    `Preparation time: ${formatMs(elapsed)}`
  );

  console.log(
    "Authentication hashing is excluded from the queue benchmark."
  );

  return {
    users,
    elapsed
  };
};

const joinQueue = async (
  users
) => {
  console.log("");
  console.log(
    "2. Sending 50,000 concurrent queue requests..."
  );

  const start =
    performance.now();

  const results =
    await runPool(
      users,
      JOIN_CONCURRENCY,
      async (user) => {
        return request(
          "POST",
          `/api/queue/${MATCH_ID}/join`,
          null,
          user.token
        );
      },
      "Queue joins"
    );

  const elapsed =
    performance.now() - start;

  const successful =
    results.filter(
      (result) =>
        result.ok
    );

  const failed =
    results.filter(
      (result) =>
        !result.ok
    );

  const latencies =
    results
      .map(
        (result) =>
          result.elapsed
      )
      .filter(
        (value) =>
          Number.isFinite(value)
      );

  successful.forEach(
    (result, index) => {
      const user =
        users[index];

      if (
        result.data?.position !==
        undefined
      ) {
        user.queuePosition =
          result.data.position;
      }

      user.queueEntryId =
        result.data
          ?.queueEntry
          ?.id ?? null;
    }
  );

  /*
   * The result array corresponds to users
   * in the same order, so update positions
   * using the actual result index.
   */
  results.forEach(
    (result, index) => {
      if (!result.ok) {
        return;
      }

      users[index].queuePosition =
        result.data?.position ??
        null;

      users[index].queueEntryId =
        result.data
          ?.queueEntry
          ?.id ??
        null;
    }
  );

  const queuePositions =
    users
      .map(
        (user) =>
          user.queuePosition
      )
      .filter(
        (position) =>
          Number.isInteger(position)
      );

  const uniquePositions =
    new Set(queuePositions);

  const queueRps =
    elapsed > 0
      ? successful.length /
        (elapsed / 1000)
      : 0;

  console.log("");
  console.log(
    `Queue join time: ${formatMs(elapsed)}`
  );

  console.log(
    `Successful joins: ${successful.length}`
  );

  console.log(
    `Failed joins: ${failed.length}`
  );

  console.log(
    `Unique queue positions: ${uniquePositions.size}`
  );

  console.log(
    `Queue throughput: ${queueRps.toFixed(2)} requests/sec`
  );

  console.log(
    `Queue latency p50: ${formatMs(percentile(latencies, 50))}`
  );

  console.log(
    `Queue latency p95: ${formatMs(percentile(latencies, 95))}`
  );

  console.log(
    `Queue latency p99: ${formatMs(percentile(latencies, 99))}`
  );

  return {
    results,
    elapsed,
    successful:
      successful.length,
    failed:
      failed.length,
    queuePositions,
    uniquePositions
  };
};

const getAdmissionCandidates = (
  users
) => {
  return users
    .filter(
      (user) =>
        Number.isInteger(
          user.queuePosition
        ) &&
        user.queuePosition <=
          TOTAL_SEATS
    )
    .sort(
      (a, b) =>
        a.queuePosition -
        b.queuePosition
    );
};

const waitForAdmission = async (
  candidates
) => {
  console.log("");
  console.log(
    "3. Waiting for fair admission..."
  );

  const start =
    performance.now();

  const admittedUsers =
    new Map();

  while (
    performance.now() - start <
    MAX_ADMISSION_WAIT_MS
  ) {
    const pendingUsers =
      candidates.filter(
        (user) =>
          !admittedUsers.has(
            user.index
          )
      );

    if (
      pendingUsers.length === 0
    ) {
      break;
    }

    const results =
      await runPool(
        pendingUsers,
        STATUS_CONCURRENCY,
        async (user) => {
          return request(
            "GET",
            `/api/queue/${MATCH_ID}/status`,
            null,
            user.token
          );
        }
      );

    results.forEach(
      (result, resultIndex) => {
        if (!result.ok) {
          return;
        }

        const user =
          pendingUsers[resultIndex];

        const status =
          result.data
            ?.queueEntry
            ?.status;

        if (
          status === "admitted"
        ) {
          admittedUsers.set(
            user.index,
            user
          );
        }
      }
    );

    console.log(
      `Admitted: ${admittedUsers.size}/${candidates.length}`
    );

    if (
      admittedUsers.size >=
      TOTAL_SEATS
    ) {
      break;
    }

    await sleep(
      STATUS_POLL_INTERVAL_MS
    );
  }

  const admitted =
    Array.from(
      admittedUsers.values()
    ).sort(
      (a, b) =>
        a.queuePosition -
        b.queuePosition
    );

  const elapsed =
    performance.now() - start;

  console.log("");
  console.log(
    `Admission wait time: ${formatMs(elapsed)}`
  );

  console.log(
    `Users admitted: ${admitted.length}`
  );

  return {
    admitted,
    elapsed
  };
};

const reserveSeats = async (
  admittedUsers
) => {
  console.log("");
  console.log(
    "4. Reserving admitted users' seats..."
  );

  const start =
    performance.now();

  const results =
    await runPool(
      admittedUsers,
      RESERVE_CONCURRENCY,
      async (user) => {
        return request(
          "POST",
          `/api/reservations/${MATCH_ID}/reserve`,
          null,
          user.token
        );
      }
    );

  const elapsed =
    performance.now() - start;

  const successful =
    results.filter(
      (result) =>
        result.ok
    );

  const failed =
    results.filter(
      (result) =>
        !result.ok
    );

  const seatNumbers =
    successful
      .map(
        (result) =>
          result.data
            ?.seat
            ?.seat_number
      )
      .filter(
        (seatNumber) =>
          Number.isInteger(
            seatNumber
          )
      );

  const uniqueSeats =
    new Set(seatNumbers);

  const latencies =
    results
      .map(
        (result) =>
          result.elapsed
      )
      .filter(
        (value) =>
          Number.isFinite(value)
      );

  const reservationRps =
    elapsed > 0
      ? successful.length /
        (elapsed / 1000)
      : 0;

  console.log("");
  console.log(
    `Reservation time: ${formatMs(elapsed)}`
  );

  console.log(
    `Successful reservations: ${successful.length}`
  );

  console.log(
    `Failed reservations: ${failed.length}`
  );

  console.log(
    `Seats allocated: ${seatNumbers.length}`
  );

  console.log(
    `Unique seats: ${uniqueSeats.size}`
  );

  console.log(
    `Reservation throughput: ${reservationRps.toFixed(2)} requests/sec`
  );

  console.log(
    `Reservation latency p50: ${formatMs(percentile(latencies, 50))}`
  );

  console.log(
    `Reservation latency p95: ${formatMs(percentile(latencies, 95))}`
  );

  console.log(
    `Reservation latency p99: ${formatMs(percentile(latencies, 99))}`
  );

  return {
    results,
    elapsed,
    successful,
    failed,
    seatNumbers,
    uniqueSeats
  };
};

const printFinalReport = ({
  users,
  preparation,
  queue,
  admission,
  reservations
}) => {
  const admittedPositions =
    admission.admitted
      .map(
        (user) =>
          user.queuePosition
      )
      .filter(
        (position) =>
          Number.isInteger(position)
      );

  const duplicateSeatCount =
    reservations.seatNumbers.length -
    reservations.uniqueSeats.size;

  const firstPosition =
    admittedPositions.length > 0
      ? Math.min(
          ...admittedPositions
        )
      : null;

  const lastPosition =
    admittedPositions.length > 0
      ? Math.max(
          ...admittedPositions
        )
      : null;

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "       FAIR DROP LOAD TEST RESULTS"
  );

  console.log(
    "========================================"
  );

  console.log("");

  console.log(
    `Virtual users:              ${users.length}`
  );

  console.log(
    `Seats available:            ${TOTAL_SEATS}`
  );

  console.log(
    `Users prepared:             ${users.length}`
  );

  console.log(
    `Queue joins:                ${queue.successful}`
  );

  console.log(
    `Queue failures:             ${queue.failed}`
  );

  console.log(
    `Users admitted:             ${admission.admitted.length}`
  );

  console.log(
    `Successful reservations:    ${reservations.successful.length}`
  );

  console.log(
    `Failed reservations:        ${reservations.failed.length}`
  );

  console.log("");

  console.log(
    "Seat safety:"
  );

  console.log(
    `Seats allocated:            ${reservations.seatNumbers.length}`
  );

  console.log(
    `Unique seats allocated:     ${reservations.uniqueSeats.size}`
  );

  console.log(
    `Duplicate seats:            ${duplicateSeatCount}`
  );

  console.log("");

  console.log(
    "Fairness:"
  );

  console.log(
    `First admitted position:    ${firstPosition ?? "N/A"}`
  );

  console.log(
    `Last admitted position:     ${lastPosition ?? "N/A"}`
  );

  console.log("");

  console.log(
    "Performance:"
  );

  console.log(
    `User preparation:           ${formatMs(preparation.elapsed)}`
  );

  console.log(
    `Queue processing:           ${formatMs(queue.elapsed)}`
  );

  console.log(
    `Admission wait:             ${formatMs(admission.elapsed)}`
  );

  console.log(
    `Reservation processing:     ${formatMs(reservations.elapsed)}`
  );

  console.log("");

  const pass =
    queue.successful ===
      NUMBER_OF_USERS &&
    admission.admitted.length ===
      TOTAL_SEATS &&
    reservations.successful.length ===
      TOTAL_SEATS &&
    reservations.uniqueSeats.size ===
      TOTAL_SEATS &&
    duplicateSeatCount === 0;

  console.log(
    "========================================"
  );

  if (pass) {
    console.log(
      "PASS: 50,000 users competed for 500 seats."
    );

    console.log(
      "PASS: Exactly 500 unique seats were allocated."
    );

    console.log(
      "PASS: No duplicate seat allocation detected."
    );
  } else {
    console.log(
      "RESULT: Test completed with non-ideal metrics."
    );
  }

  console.log(
    "========================================"
  );
};

const main = async () => {
  console.log(
    "========================================"
  );

  console.log(
    "       FAIR DROP 50,000 USER TEST"
  );

  console.log(
    "========================================"
  );

  console.log("");

  console.log(
    `Match ID: ${MATCH_ID}`
  );

  console.log(
    `Virtual users: ${NUMBER_OF_USERS}`
  );

  console.log(
    `Available seats: ${TOTAL_SEATS}`
  );

  console.log("");

  const preparation =
    await prepareUsers();

  const users =
    preparation.users;

  const queue =
    await joinQueue(users);

  if (
    queue.successful === 0
  ) {
    console.error(
      "No users successfully joined the queue."
    );

    process.exit(1);
  }

  const candidates =
    getAdmissionCandidates(
      users
    );

  console.log("");

  console.log(
    `Users with queue positions in top ${TOTAL_SEATS}: ${candidates.length}`
  );

  const admission =
    await waitForAdmission(
      candidates
    );

  if (
    admission.admitted.length === 0
  ) {
    console.error(
      "No users were admitted."
    );

    process.exit(1);
  }

  const reservations =
    await reserveSeats(
      admission.admitted
    );

  printFinalReport({
    users,
    preparation,
    queue,
    admission,
    reservations
  });
};

main().catch(
  (error) => {
    console.error("");
    console.error(
      "Fatal simulator error:",
      error
    );

    process.exit(1);
  }
);