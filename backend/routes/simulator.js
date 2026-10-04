const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database/db");

const router = express.Router();

const SIMULATOR_PASSWORD = "TestPassword123!";

router.post("/prepare-users", async (req, res) => {
  try {
    if (
      process.env.NODE_ENV !== "development" ||
      process.env.SIMULATOR_MODE !== "true"
    ) {
      return res.status(403).json({
        success: false,
        message: "Simulator mode is disabled"
      });
    }

    const count = Math.min(
      Math.max(
        Number(req.body.count) || 0,
        1
      ),
      50000
    );

    const runId =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    /*
     * Hash the simulator password only once.
     *
     * We do NOT bcrypt-hash 50,000 passwords.
     * All simulator users use the same test password.
     */
    const passwordHash =
      await bcrypt.hash(
        SIMULATOR_PASSWORD,
        12
      );

    const client = await db.connect();

    let users;

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        INSERT INTO users (
          name,
          email,
          password_hash
        )
        SELECT
          'Benchmark User ' || number,
          'benchmark-${runId}-' || number || '@example.com',
          $1
        FROM generate_series(1, $2) AS number
        RETURNING id, name, email
        `,
        [
          passwordHash,
          count
        ]
      );

      users = result.rows;

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    /*
     * Create JWT tokens directly for the benchmark.
     *
     * This avoids spending the benchmark time on
     * 50,000 bcrypt login operations.
     */
    const authenticatedUsers =
      users.map((user) => {
        const token = jwt.sign(
          {
            userId: user.id
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h"
          }
        );

        return {
          ...user,
          token
        };
      });

    res.status(201).json({
      success: true,
      message: "Simulator users prepared",
      count: authenticatedUsers.length,
      runId,
      users: authenticatedUsers
    });
  } catch (error) {
    console.error(
      "Simulator user preparation error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to prepare simulator users"
    });
  }
});

module.exports = router;