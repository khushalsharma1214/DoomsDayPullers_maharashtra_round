const express = require("express");

const {
  joinQueue,
  getQueueStatus
} = require("../controllers/queueController");

const {
  rateLimiter
} = require("../middleware/rateLimiter");

const {
  authenticateUser
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/:matchId/join",
  authenticateUser,
  rateLimiter,
  joinQueue
);

router.get(
  "/:matchId/status",
  authenticateUser,
  rateLimiter,
  getQueueStatus
);

module.exports = router;