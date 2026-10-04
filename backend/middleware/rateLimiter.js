const { redisClient } = require("../config/redis");

const WINDOW_SECONDS = 60;
const BURST_WINDOW_SECONDS = 10;

const MAX_REQUESTS_PER_USER = 15;
const MAX_REQUESTS_PER_IP = 60;
const MAX_BURST_PER_USER = 5;

/*
 * Development-only simulator bypass.
 *
 * This allows the load-testing simulator to represent many
 * virtual users from one computer without triggering the
 * real-user IP protection.
 *
 * IMPORTANT:
 * This bypass only works when:
 * NODE_ENV=development
 * AND
 * X-Simulator=true
 */
const isSimulatorRequest = (req) => {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.SIMULATOR_MODE === "true" &&
    req.headers["x-simulator"] === "true"
  );
};

const rateLimiter = async (req, res, next) => {
  try {
    /*
     * Allow the local simulator to generate high-concurrency
     * test traffic without being treated as one real IP.
     *
     * Real users are still rate limited normally.
     */
    if (isSimulatorRequest(req)) {
      return next();
    }

    const ip =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      "unknown";

    const userId =
      req.user?.id || "anonymous";

    const userKey =
      `rate-limit:user:${userId}`;

    const ipKey =
      `rate-limit:ip:${ip}`;

    const burstKey =
      `rate-limit:burst:user:${userId}`;

    /*
     * Count requests inside the normal 60-second window.
     */
    const userCount =
      await redisClient.incr(userKey);

    if (userCount === 1) {
      await redisClient.expire(
        userKey,
        WINDOW_SECONDS
      );
    }

    /*
     * Count requests from the IP.
     */
    const ipCount =
      await redisClient.incr(ipKey);

    if (ipCount === 1) {
      await redisClient.expire(
        ipKey,
        WINDOW_SECONDS
      );
    }

    /*
     * Short burst protection.
     */
    const burstCount =
      await redisClient.incr(burstKey);

    if (burstCount === 1) {
      await redisClient.expire(
        burstKey,
        BURST_WINDOW_SECONDS
      );
    }

    /*
     * Per-user protection.
     */
    if (
      userCount >
      MAX_REQUESTS_PER_USER
    ) {
      await recordAbuseSignal(
        userId,
        "user-rate-limit"
      );

      return res.status(429).json({
        success: false,
        message:
          "Too many requests from this account",
        retryAfter:
          WINDOW_SECONDS
      });
    }

    /*
     * Short burst protection.
     */
    if (
      burstCount >
      MAX_BURST_PER_USER
    ) {
      await recordAbuseSignal(
        userId,
        "request-burst"
      );

      return res.status(429).json({
        success: false,
        message:
          "Too many requests in a short period",
        retryAfter:
          BURST_WINDOW_SECONDS
      });
    }

    /*
     * Per-IP protection.
     */
    if (
      ipCount >
      MAX_REQUESTS_PER_IP
    ) {
      await recordAbuseSignal(
        userId,
        "ip-rate-limit"
      );

      return res.status(429).json({
        success: false,
        message:
          "Too many requests from this IP",
        retryAfter:
          WINDOW_SECONDS
      });
    }

    next();
  } catch (error) {
    console.error(
      "Rate limiter error:",
      error.message
    );

    /*
     * Redis failure should not bring down
     * the API.
     */
    next();
  }
};

/*
 * Maintain a temporary abuse score.
 *
 * This is a signal rather than an automatic
 * bot classification.
 */
const recordAbuseSignal = async (
  userId,
  signal
) => {
  try {
    const abuseKey =
      `abuse:score:${userId}`;

    const score =
      await redisClient.incr(
        abuseKey
      );

    if (score === 1) {
      await redisClient.expire(
        abuseKey,
        5 * 60
      );
    }

    console.warn(
      `Abuse signal: user=${userId}, signal=${signal}, score=${score}`
    );
  } catch (error) {
    console.error(
      "Abuse scoring error:",
      error.message
    );
  }
};

module.exports = {
  rateLimiter
};