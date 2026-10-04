const express = require("express");

const {
  reserveSeat,
  confirmReservation
} = require("../controllers/reservationsController");

const {
  authenticateUser
} = require("../middleware/authMiddleware");

const {
  rateLimiter
} = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/:matchId/reserve",
  authenticateUser,
  rateLimiter,
  reserveSeat
);

router.post(
  "/:reservationId/confirm",
  authenticateUser,
  rateLimiter,
  confirmReservation
);

module.exports = router;