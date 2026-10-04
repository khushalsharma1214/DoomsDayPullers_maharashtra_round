/**
 * Integrated API Client for Fair-Drop Cricket Ticketing System
 * Connects Frontend with:
 * 1. Teammate 2 Backend (Port 5000): Authentication, User Profiles, Real Queue, Seat Reservations
 * 2. Anti-Bot Backend (Port 3000 / 5000): Proof of Work cryptographic challenge & rate-limiting defense
 * 3. Teammate 4 Allocation (Port 5000 / 3000): 50,000 Traffic Analytics & Live Bot Attack Simulation
 */

export const TEAMMATE2_URL = 'http://localhost:5000';
export const ANTIBOT_URL = 'http://localhost:3000';

export interface ChallengeResponse {
  nonce: string;
  difficulty: number;
}

export interface InventoryStatus {
  matchId?: number;
  availableSeats: number;
  totalSeats: number;
  bookedCount: number;
  bookedSeatNumbers?: number[];
  activeShield?: boolean;
  serverOnline?: boolean;
}

export interface PurchasePayload {
  userId: string;
  nonce: string;
  clientHash: string;
  counter?: number;
}

export interface PurchaseResponse {
  success?: boolean;
  message?: string;
  error?: string;
  reason?: string;
  userId?: string;
}

export interface UserAuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    created_at?: string;
  };
}

export interface QueueEntry {
  id: number;
  user_id: number;
  match_id: number;
  status: 'waiting' | 'admitted' | 'completed';
  joined_at: string;
  admitted_at: string | null;
}

export interface QueueStatusResponse {
  success: boolean;
  queueEntry: QueueEntry;
  position: number | null;
  queueLength?: number | null;
  sessionActive?: boolean;
  message?: string;
}

export interface SimulationState {
  isRunning: boolean;
  stopRequested?: boolean;
  mode: string;
  totalRequests: number;
  processedRequests: number;
  concurrency?: number;
  normalAllowed: number;
  seatsAllocated?: number;
  availableSeats?: number;
  soldOut?: boolean;
  botsBlocked: number;
  duplicatePrevented: number;
  avgLatencyMs: number;
  throughputRps: number;
  recentLogs: Array<{
    timestamp: string;
    type: 'BOT_BLOCKED' | 'NORMAL_QUEUED' | 'SOLD_OUT' | 'SYSTEM_STOPPED';
    userId: string;
    reason: string;
    status: string;
  }>;
}

export interface Analytics50kData {
  benchmarkOverview: {
    totalEvaluated: number;
    uniqueSeatsAllocated: number;
    oversellingDetected: string;
    duplicateAllocations: string;
    peakThroughput: string;
    botIncursionsDefeated: string;
    medianLatency: string;
  };
  testScenarios: Array<{
    name: string;
    totalRequests: number;
    normalRequests?: number;
    botRequests?: number;
    successful: number;
    failed: number;
    throughputRps: number;
    avgLatencyMs: number;
    medianLatencyMs: number;
    normalTickets?: number;
    botTickets?: number;
    notes?: string;
  }>;
}

// SHA-256 Web Crypto Helper
async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Proof of Work solver
export async function solveProofOfWork(
  nonce: string,
  difficulty = 3,
  onProgress?: (counter: number, currentHash: string) => void
): Promise<{ hash: string; counter: number; timeMs: number }> {
  const prefix = '0'.repeat(difficulty);
  let counter = 0;
  const startTime = performance.now();

  while (true) {
    const input = `${nonce}${counter}`;
    const hash = await sha256(input);

    if (counter % 100 === 0 && onProgress) {
      onProgress(counter, hash);
      await new Promise((res) => setTimeout(res, 0));
    }

    if (hash.startsWith(prefix)) {
      const timeMs = Math.round(performance.now() - startTime);
      if (onProgress) onProgress(counter, hash);
      return { hash, counter, timeMs };
    }

    counter++;
    if (counter > 1000000) {
      throw new Error('Proof of work computation limit exceeded');
    }
  }
}

// 1. Anti-Bot Challenge (Tries Port 3000 first, falls back to 5000)
export async function fetchChallenge(): Promise<ChallengeResponse> {
  try {
    const res = await fetch(`${ANTIBOT_URL}/api/drop/challenge`);
    if (res.ok) return res.json();
  } catch {}
  const fallbackRes = await fetch(`${TEAMMATE2_URL}/api/drop/challenge`);
  return fallbackRes.json();
}

// 2. Buy Seat / Anti-Bot Validation
export async function submitSeatPurchase(
  payload: PurchasePayload
): Promise<PurchaseResponse> {
  try {
    const res = await fetch(`${ANTIBOT_URL}/api/drop/buy-seat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}`,
        reason: data.reason || 'UNKNOWN_ERROR',
      };
    }
    return {
      success: true,
      message: data.message || 'Seat allocated successfully',
      userId: data.userId,
    };
  } catch (err: any) {
    // Fallback to Teammate 2 integrated drop endpoint
    const fallbackRes = await fetch(`${TEAMMATE2_URL}/api/drop/buy-seat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await fallbackRes.json();
    return {
      success: fallbackRes.ok,
      message: data.message,
      error: data.error,
      reason: data.reason,
      userId: data.userId,
    };
  }
}

// 3. Inventory Status
export async function fetchInventoryStatus(matchId?: number | string): Promise<InventoryStatus> {
  const numericId = matchId
    ? typeof matchId === 'string'
      ? matchId.replace('match-0', '').replace('match-', '')
      : matchId
    : 1;
  try {
    const res = await fetch(`${TEAMMATE2_URL}/api/drop/status?matchId=${numericId}`);
    if (res.ok) return res.json();
  } catch {}
  try {
    const fallbackRes = await fetch(`${ANTIBOT_URL}/api/drop/status?matchId=${numericId}`);
    if (fallbackRes.ok) return fallbackRes.json();
  } catch {}
  return {
    matchId: Number(numericId),
    availableSeats: 500,
    totalSeats: 500,
    bookedCount: 0,
    bookedSeatNumbers: [],
    activeShield: true,
    serverOnline: false,
  };
}

// 4. Reset Inventory
export async function resetInventory(matchId?: number | string): Promise<{ message: string; stats: InventoryStatus }> {
  const numericId = matchId
    ? typeof matchId === 'string'
      ? matchId.replace('match-0', '').replace('match-', '')
      : matchId
    : null;

  let stats: InventoryStatus = {
    matchId: numericId ? Number(numericId) : 1,
    availableSeats: 500,
    totalSeats: 500,
    bookedCount: 0,
    bookedSeatNumbers: [],
    activeShield: true,
    serverOnline: true,
  };

  // 1. Reset primary Teammate 2 backend (Port 5000): database, match seats, redis, reservations
  try {
    const resT2 = await fetch(`${TEAMMATE2_URL}/api/drop/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: numericId }),
    });
    if (resT2.ok) {
      const data2 = await resT2.json();
      if (data2.stats) stats = data2.stats;
    }
  } catch (err) {
    console.warn('Failed to reset Teammate 2 backend:', err);
  }

  // 2. Also reset simulator state on Port 5000
  try {
    await fetch(`${TEAMMATE2_URL}/api/simulator/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: numericId }),
    });
  } catch (err) {
    console.warn('Failed to reset simulator state:', err);
  }

  // 3. Reset Anti-Bot backend (Port 3000): its embedded redis
  try {
    await fetch(`${ANTIBOT_URL}/api/drop/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: numericId }),
    });
  } catch (err) {
    console.warn('Failed to reset Anti-Bot backend:', err);
  }

  return {
    message: 'Inventory reset to 500 seats across all backends',
    stats,
  };
}

// =========================================================================
// TEAMMATE 2: AUTHENTICATION & USER PROFILE SERVICES
// =========================================================================

export async function registerUser(name: string, email: string, password = 'Password123!'): Promise<UserAuthResponse> {
  const res = await fetch(`${TEAMMATE2_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function loginUser(email: string, password = 'Password123!'): Promise<UserAuthResponse> {
  const res = await fetch(`${TEAMMATE2_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function fetchUserProfile(token: string): Promise<any> {
  const res = await fetch(`${TEAMMATE2_URL}/api/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function saveUserProfile(token: string, profile: { name?: string; email?: string; phone?: string }): Promise<any> {
  const res = await fetch(`${TEAMMATE2_URL}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

// =========================================================================
// TEAMMATE 2: REAL WAITING QUEUE & SEAT RESERVATION SERVICES
// =========================================================================

export async function joinQueue(matchId: number | string, token: string): Promise<QueueStatusResponse> {
  const id = typeof matchId === 'string' ? matchId.replace('match-', '') : matchId;
  const res = await fetch(`${TEAMMATE2_URL}/api/queue/${id}/join`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}

export async function fetchQueueStatus(matchId: number | string, token: string): Promise<QueueStatusResponse> {
  const id = typeof matchId === 'string' ? matchId.replace('match-', '') : matchId;
  const res = await fetch(`${TEAMMATE2_URL}/api/queue/${id}/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function reserveSeat(
  matchId: number | string,
  token: string,
  seatsCount = 1,
  seatNumbers?: number[]
): Promise<any> {
  const id = typeof matchId === 'string' ? matchId.replace('match-0', '').replace('match-', '') : matchId;
  const res = await fetch(`${TEAMMATE2_URL}/api/reservations/${id}/reserve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ seatsCount, seatNumbers }),
  });
  return res.json();
}

// =========================================================================
// TEAMMATE 4: TRAFFIC SIMULATOR & 50,000 DATA ANALYTICS
// =========================================================================

export async function runTrafficSimulation(
  mode: 'bot_flood' | 'baseline' | 'flash_crowd' = 'bot_flood',
  total = 100,
  botRatio = 0.6,
  concurrency = 50,
  matchId: number | string = 1
): Promise<{ success: boolean; message: string; totalRequests?: number; concurrency?: number }> {
  const id = typeof matchId === 'string' ? Number(matchId.replace('match-0', '').replace('match-', '')) || 1 : matchId;
  const res = await fetch(`${TEAMMATE2_URL}/api/simulator/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, total, botRatio, concurrency, matchId: id }),
  });
  return res.json();
}

export async function stopTrafficSimulation(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${TEAMMATE2_URL}/api/simulator/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function fetchSimulationStatus(matchId?: number | string): Promise<{ success: boolean; state: SimulationState }> {
  const numericId = matchId
    ? typeof matchId === 'string'
      ? matchId.replace('match-0', '').replace('match-', '')
      : matchId
    : 1;
  const res = await fetch(`${TEAMMATE2_URL}/api/simulator/status?matchId=${numericId}`);
  return res.json();
}

export async function fetch50kAnalytics(): Promise<{ success: boolean; analytics: Analytics50kData }> {
  const res = await fetch(`${TEAMMATE2_URL}/api/simulator/analytics-50k`);
  return res.json();
}
