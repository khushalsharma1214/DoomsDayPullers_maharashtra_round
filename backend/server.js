const express = require("express");

const healthRouter = require("./routes/health");
const matchesRouter = require("./routes/matches");
const usersRouter = require("./routes/users");
const queueRouter = require("./routes/queue");
const reservationsRouter = require("./routes/reservations");
const authRouter = require("./routes/auth");

const db = require("./database/db");

const {
  expireReservations
} = require("./services/reservationExpiryService");

const {
  admitUsers
} = require("./services/fairAdmissionService");

const {
  connectRedis
} = require("./config/redis");

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/users", usersRouter);
app.use("/api/queue", queueRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Fair Drop backend is running"
  });
});

const PORT = 5000;

const runFairAdmission = async () => {
  try {
    const result = await db.query(
      `
      SELECT id
      FROM matches
      WHERE status = 'upcoming'
      ORDER BY match_date ASC
      `
    );

    for (const match of result.rows) {
      await admitUsers(match.id);
    }
  } catch (error) {
    console.error(
      "Fair admission scheduler error:",
      error.message
    );
  }
};

const startServer = async () => {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });

    setInterval(() => {
      expireReservations();
    }, 30 * 1000);

    setInterval(() => {
      runFairAdmission();
    }, 10 * 1000);
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
};

startServer();