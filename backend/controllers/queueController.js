const db = require("../database/db");
const { redisClient } = require("../config/redis");

const {
  createQueueSession,
  refreshQueueSession,
  getQueueSession
} = require("../services/sessionService");

const joinQueue = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    // Verify that the match exists.
    const matchResult = await db.query(
      `
      SELECT id, status, total_seats, available_seats
      FROM matches
      WHERE id = $1
      `,
      [matchId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const match = matchResult.rows[0];

    if (match.status !== "upcoming") {
      return res.status(409).json({
        success: false,
        message: "Queue is not open for this match"
      });
    }

    /*
     * PostgreSQL unique partial index prevents duplicate
     * waiting entries for the same user and match.
     */
    const result = await db.query(
      `
      INSERT INTO queue_entries (
        user_id,
        match_id,
        status
      )
      VALUES ($1, $2, 'waiting')
      RETURNING
        id,
        user_id,
        match_id,
        status,
        joined_at,
        admitted_at
      `,
      [userId, matchId]
    );

    const queueEntry = result.rows[0];

    /*
     * PostgreSQL is persistent state.
     * Redis is the fast fair-admission queue.
     */
    const redisQueueKey = `fair-queue:${matchId}`;

    await redisClient.rPush(
      redisQueueKey,
      queueEntry.id.toString()
    );

    const session = await createQueueSession(
      userId,
      matchId,
      queueEntry.id
    );

    /*
     * Calculate the user's Redis position.
     * Redis positions are zero-based, so add 1 for the API.
     */
    const redisPosition = await redisClient.lPos(
      redisQueueKey,
      queueEntry.id.toString()
    );

    res.status(201).json({
      success: true,
      queueEntry,
      position:
        redisPosition === null
          ? null
          : redisPosition + 1,
      session
    });
  } catch (error) {
    console.error(
      "Error joining queue:",
      error.message
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "User is already waiting in this match queue"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to join queue"
    });
  }
};

const getQueueStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    /*
     * PostgreSQL remains the source of truth for the user's
     * persistent queue state.
     */
    const result = await db.query(
      `
      SELECT
        id,
        user_id,
        match_id,
        status,
        joined_at,
        admitted_at
      FROM queue_entries
      WHERE match_id = $1
      AND user_id = $2
      AND status IN ('waiting', 'admitted', 'completed')
      ORDER BY joined_at DESC
      LIMIT 1
      `,
      [matchId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Queue entry not found"
      });
    }

    const queueEntry = result.rows[0];

    /*
     * Refresh the Redis-backed session so a user who keeps
     * checking their queue status remains connected.
     */
    await refreshQueueSession(
      userId,
      matchId
    );

    /*
     * Retrieve the session so reconnect/status responses can
     * confirm that the backend still recognizes the queue session.
     */
    const session = await getQueueSession(
      userId,
      matchId
    );

    let position = null;
    let queueLength = null;

    /*
     * Only waiting users have a meaningful Redis queue position.
     * Admitted/completed users have already left the fair queue.
     */
    if (queueEntry.status === "waiting") {
      const redisQueueKey = `fair-queue:${matchId}`;

      const redisPosition = await redisClient.lPos(
        redisQueueKey,
        queueEntry.id.toString()
      );

      if (redisPosition !== null) {
        position = redisPosition + 1;

        queueLength = await redisClient.lLen(
          redisQueueKey
        );
      }
    }

    res.json({
      success: true,
      queueEntry,
      position,
      queueLength,
      sessionActive: session !== null
    });
  } catch (error) {
    console.error(
      "Error fetching queue status:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch queue status"
    });
  }
};

module.exports = {
  joinQueue,
  getQueueStatus
};