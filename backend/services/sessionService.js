const { redisClient } = require("../config/redis");

const SESSION_TTL = 30 * 60; // 30 minutes

const createQueueSession = async (userId, matchId, queueEntryId) => {
  const sessionKey = `queue-session:${matchId}:${userId}`;

  const sessionData = {
    userId: userId.toString(),
    matchId: matchId.toString(),
    queueEntryId: queueEntryId.toString(),
    lastSeen: new Date().toISOString()
  };

  await redisClient.set(
    sessionKey,
    JSON.stringify(sessionData),
    {
      EX: SESSION_TTL
    }
  );

  return sessionData;
};

const getQueueSession = async (userId, matchId) => {
  const sessionKey = `queue-session:${matchId}:${userId}`;

  const data = await redisClient.get(sessionKey);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
};

const refreshQueueSession = async (userId, matchId) => {
  const sessionKey = `queue-session:${matchId}:${userId}`;

  const exists = await redisClient.exists(sessionKey);

  if (!exists) {
    return false;
  }

  await redisClient.expire(
    sessionKey,
    SESSION_TTL
  );

  return true;
};

module.exports = {
  createQueueSession,
  getQueueSession,
  refreshQueueSession
};