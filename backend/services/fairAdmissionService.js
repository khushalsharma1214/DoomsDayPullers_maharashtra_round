const db = require("../database/db");
const { redisClient } = require("../config/redis");

const ADMISSION_BATCH_SIZE = 50;

const admitUsers = async (matchId) => {
  const redisQueueKey = `fair-queue:${matchId}`;

  const client = await db.connect();

  try {
    /*
     * Read the oldest queue entries from Redis.
     *
     * We do NOT immediately remove them because PostgreSQL is
     * the source of truth for whether an entry is actually waiting.
     */
    const queueIds = await redisClient.lRange(
      redisQueueKey,
      0,
      ADMISSION_BATCH_SIZE - 1
    );

    if (queueIds.length === 0) {
      return 0;
    }

    const numericQueueIds = queueIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));

    if (numericQueueIds.length === 0) {
      /*
       * Redis contained invalid values.
       * Remove only the inspected invalid entries.
       */
      await redisClient.lTrim(
        redisQueueKey,
        queueIds.length,
        -1
      );

      return 0;
    }

    await client.query("BEGIN");

    /*
     * PostgreSQL is the authoritative queue state.
     *
     * Only users whose status is still "waiting" are admitted.
     */
    const result = await client.query(
      `
      UPDATE queue_entries
      SET
        status = 'admitted',
        admitted_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1::int[])
      AND match_id = $2
      AND status = 'waiting'
      RETURNING id, user_id, match_id, admitted_at
      `,
      [numericQueueIds, matchId]
    );

    await client.query("COMMIT");

    /*
     * Remove the inspected Redis entries individually.
     *
     * This is safer than lTrim(...), because PostgreSQL does not
     * guarantee that RETURNING rows are returned in Redis order.
     *
     * It also prevents stale/non-waiting entries from causing us
     * to accidentally remove a different user's queue position.
     */
    if (numericQueueIds.length > 0) {
      const admittedIds = new Set(
        result.rows.map((entry) => entry.id)
      );

      for (const queueId of numericQueueIds) {
        await redisClient.lRem(
          redisQueueKey,
          1,
          queueId.toString()
        );
      }

      /*
       * Log only successfully admitted users.
       */
      if (admittedIds.size > 0) {
        console.log(
          `Fair admission: admitted ${admittedIds.size} user(s) for match ${matchId}`
        );
      }
    }

    return result.rows.length;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError.message
      );
    }

    console.error(
      "Fair admission error:",
      error.message
    );

    return 0;
  } finally {
    client.release();
  }
};

module.exports = {
  admitUsers
};
