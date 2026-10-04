import React, { useState, useEffect } from 'react';
import {
  fetchInventoryStatus,
  resetInventory,
  runTrafficSimulation,
  stopTrafficSimulation,
  fetchSimulationStatus,
} from '../services/integratedApi';
import type { InventoryStatus, SimulationState } from '../services/integratedApi';

interface AntiBotHUDProps {
  matchId?: string | number;
  onNotify?: (msg: string, type: 'info' | 'success' | 'danger') => void;
  onOpenAnalyticsModal?: () => void;
  onSeatsUpdated?: (availableSeats: number) => void;
  onBookedSeatsLoaded?: (bookedSeatNumbers: number[]) => void;
  onReset?: () => void;
}

export const AntiBotHUD: React.FC<AntiBotHUDProps> = ({
  matchId = 1,
  onNotify,
  onOpenAnalyticsModal,
  onSeatsUpdated,
  onBookedSeatsLoaded,
  onReset,
}) => {
  const [status, setStatus] = useState<InventoryStatus | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Simulation controls (Cap 50,000 requests)
  const [simMode, setSimMode] = useState<'bot_flood' | 'baseline' | 'flash_crowd'>('bot_flood');
  const [totalRequests, setTotalRequests] = useState<number>(100);
  const [concurrency, setConcurrency] = useState<number>(50); // Requests at a time
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const numericMatchId = matchId
    ? typeof matchId === 'string'
      ? Number(matchId.replace('match-0', '').replace('match-', '')) || 1
      : matchId
    : 1;

  const refreshStatus = async () => {
    try {
      const data = await fetchInventoryStatus(numericMatchId);
      setStatus(data);
      setServerOnline(true);
      if (onSeatsUpdated && data.availableSeats !== undefined) {
        onSeatsUpdated(data.availableSeats);
      }
      if (onBookedSeatsLoaded && data.bookedSeatNumbers) {
        onBookedSeatsLoaded(data.bookedSeatNumbers);
      }
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 2500);
    return () => clearInterval(interval);
  }, [numericMatchId]);

  // Poll simulation status at 120ms during active attack so seat counter decreases smoothly and visibly
  useEffect(() => {
    let timer: any;
    if (isSimulating) {
      timer = setInterval(async () => {
        try {
          const res = await fetchSimulationStatus(numericMatchId);
          if (res.success && res.state) {
            setSimState(res.state);

            // Real-time seat updates
            if (res.state.availableSeats !== undefined) {
              const currentAvail = Number(res.state.availableSeats);
              setStatus({
                matchId: numericMatchId,
                availableSeats: currentAvail,
                totalSeats: 500,
                bookedCount: Math.max(0, 500 - currentAvail),
                activeShield: true,
                serverOnline: true,
              });
              if (onSeatsUpdated) {
                onSeatsUpdated(currentAvail);
              }
            }

            if (!res.state.isRunning) {
              setIsSimulating(false);
              if (res.state.availableSeats !== undefined) {
                const finalSeats = Number(res.state.availableSeats);
                if (onSeatsUpdated) onSeatsUpdated(finalSeats);
              }
              if (onNotify) {
                const soldOutMsg = res.state.soldOut ? ' [CAPACITY EXHAUSTED - SOLD OUT]' : '';
                onNotify(
                  `Simulation Finished: ${res.state.normalAllowed} Tickets Bought, ${res.state.botsBlocked} Bots Neutralized${soldOutMsg}`,
                  res.state.soldOut ? 'danger' : 'success'
                );
              }
            }
          }
        } catch {}
      }, 120);
    }
    return () => clearInterval(timer);
  }, [isSimulating, numericMatchId, onNotify, onSeatsUpdated]);

  const handleResetSeats = async () => {
    setIsResetting(true);
    try {
      await stopTrafficSimulation();
      setIsSimulating(false);
      setSimState(null);
      const res = await resetInventory(numericMatchId);
      setStatus(
        res.stats || {
          matchId: numericMatchId,
          availableSeats: 500,
          totalSeats: 500,
          bookedCount: 0,
          bookedSeatNumbers: [],
          activeShield: true,
          serverOnline: true,
        }
      );
      if (onSeatsUpdated) onSeatsUpdated(500);
      if (onReset) onReset();
      if (onNotify) onNotify('Seat inventory reset to 500 seats across all systems', 'success');
    } catch {
      if (onNotify) onNotify('Failed to connect to backend server', 'danger');
    } finally {
      setIsResetting(false);
    }
  };

  const handleStartSimulation = async () => {
    const cappedTotal = Math.min(50000, Math.max(10, totalRequests));
    const cappedConcurrency = Math.min(1000, Math.max(1, concurrency));

    setIsSimulating(true);
    try {
      const botRatio = simMode === 'baseline' ? 0 : simMode === 'bot_flood' ? 0.6 : 0.45;
      const res = await runTrafficSimulation(simMode, cappedTotal, botRatio, cappedConcurrency, numericMatchId);
      if (res.success) {
        if (onNotify) {
          onNotify(
            `Traffic Simulation Started: ${cappedTotal.toLocaleString()} requests (${cappedConcurrency} at a time)`,
            'info'
          );
        }
      } else {
        setIsSimulating(false);
        if (onNotify) onNotify(res.message || 'Simulation start failed', 'danger');
      }
    } catch {
      setIsSimulating(false);
      if (onNotify) onNotify('Failed to start traffic simulation', 'danger');
    }
  };

  const handleStopSimulation = async () => {
    try {
      await stopTrafficSimulation();
      setIsSimulating(false);
      if (onNotify) onNotify('Simulation stopped', 'info');
      refreshStatus();
    } catch {}
  };

  const currentAvailableSeats =
    simState && simState.availableSeats !== undefined
      ? simState.availableSeats
      : status
      ? status.availableSeats
      : 500;

  const isSoldOut = currentAvailableSeats <= 0;

  return (
    <div className="anti-bot-hud-panel">
      {/* HUD Header */}
      <div className="hud-header">
        <div className="hud-badge-group">
          <span className={`hud-pulse-dot ${serverOnline ? 'online' : 'offline'}`} />
          <span className="hud-title">FAIR-DROP ANTI-BOT & ALLOCATION NODE</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="hud-backend-endpoint">
            {serverOnline ? 'BACKENDS ONLINE :5000 & :3000' : 'BACKEND OFFLINE'}
          </span>
          {onOpenAnalyticsModal && (
            <button
              type="button"
              onClick={onOpenAnalyticsModal}
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              📊 50K DATASET
            </button>
          )}
        </div>
      </div>

      {/* Main Metrics Row (Real-time seat reduction) */}
      <div className="hud-metrics-row">
        <div className="hud-metric-box">
          <span className="metric-label">AVAILABLE SEATS</span>
          <span
            className="metric-val"
            style={{
              color: isSoldOut ? '#ef4444' : '#00e5ff',
              textShadow: isSoldOut
                ? '0 0 10px rgba(239, 68, 68, 0.6)'
                : '0 0 10px rgba(0, 229, 255, 0.6)',
            }}
          >
            {isSoldOut ? '0 SOLD OUT' : currentAvailableSeats}
            <small style={{ color: 'var(--text-secondary)' }}> / 500</small>
          </span>
        </div>

        <div className="hud-metric-box">
          <span className="metric-label">TICKETS BOUGHT (FANS)</span>
          <span className="metric-val success">
            {simState ? simState.seatsAllocated || simState.normalAllowed : 500 - currentAvailableSeats}
          </span>
        </div>

        <div className="hud-metric-box">
          <span className="metric-label">BOTS FILTERED & BLOCKED</span>
          <span className="metric-val" style={{ color: '#ef4444' }}>
            {simState ? simState.botsBlocked : 0}
          </span>
        </div>

        <div className="hud-metric-box">
          <span className="metric-label">CAPACITY / DEFENSE</span>
          <span className="metric-val accent">
            {isSoldOut ? '100% EXHAUSTED' : 'ACTIVE SHIELD'}
          </span>
        </div>
      </div>

      {/* Traffic Simulator Configuration Controls (Cap 50,000 requests) */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '12px 14px',
          margin: '10px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              TEAMMATE 4 TRAFFIC GENERATOR:
            </span>
            <select
              value={simMode}
              onChange={(e) => setSimMode(e.target.value as any)}
              disabled={isSimulating}
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'inherit',
              }}
            >
              <option value="bot_flood">Bot Flood (Teammate 4 Algorithm)</option>
              <option value="flash_crowd">Randomized Flash Crowd</option>
              <option value="baseline">Baseline Traffic (100% Real Fans)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {isSimulating ? (
              <button
                type="button"
                className="hud-action-btn danger"
                onClick={handleStopSimulation}
                style={{ padding: '6px 14px', fontSize: '11px' }}
              >
                ⏹ STOP SIMULATION
              </button>
            ) : (
              <button
                type="button"
                className="hud-action-btn primary"
                onClick={handleStartSimulation}
                disabled={!serverOnline}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  background: 'rgba(0, 229, 255, 0.2)',
                  borderColor: 'var(--accent-cyan)',
                }}
              >
                ⚡ RUN {totalRequests.toLocaleString()} REQS
              </button>
            )}

            <button
              type="button"
              className="hud-action-btn secondary"
              onClick={handleResetSeats}
              disabled={isResetting || isSimulating || !serverOnline}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              {isResetting ? 'RESETTING...' : '↺ RESET 500 SEATS'}
            </button>
          </div>
        </div>

        {/* Request Count and Concurrency Sliders / Input Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            background: 'rgba(3, 7, 18, 0.6)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
          }}
        >
          {/* Total Requests Input with Presets */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                TOTAL REQUESTS (MAX 50,000 CAP):
              </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>
                {totalRequests.toLocaleString()}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[100, 500, 1000, 5000, 10000, 50000].map((count) => (
                <button
                  key={count}
                  type="button"
                  disabled={isSimulating}
                  onClick={() => setTotalRequests(count)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: '1px solid var(--border-color)',
                    background:
                      totalRequests === count ? 'var(--accent-cyan)' : 'transparent',
                    color: totalRequests === count ? '#000000' : 'var(--text-secondary)',
                    fontWeight: totalRequests === count ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  {count >= 1000 ? `${count / 1000}k` : count}
                </button>
              ))}
              <input
                type="number"
                min="10"
                max="50000"
                step="50"
                value={totalRequests}
                disabled={isSimulating}
                onChange={(e) =>
                  setTotalRequests(
                    Math.min(50000, Math.max(10, Number(e.target.value) || 10))
                  )
                }
                style={{
                  width: '65px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  textAlign: 'center',
                }}
              />
            </div>
          </div>

          {/* Requests at a time (Concurrency) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                REQUESTS AT A TIME (CONCURRENCY):
              </span>
              <strong style={{ color: '#10b981' }}>{concurrency} at a time</strong>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[10, 50, 100, 250, 500, 1000].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  disabled={isSimulating}
                  onClick={() => setConcurrency(rate)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: '1px solid var(--border-color)',
                    background: concurrency === rate ? '#10b981' : 'transparent',
                    color: concurrency === rate ? '#000000' : 'var(--text-secondary)',
                    fontWeight: concurrency === rate ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Simulation Progress & Telemetry Stream */}
      {simState && (
        <div
          style={{
            background: 'rgba(3, 7, 18, 0.85)',
            border: isSoldOut
              ? '1px solid rgba(239, 68, 68, 0.5)'
              : '1px solid rgba(0, 229, 255, 0.3)',
            borderRadius: '6px',
            padding: '10px',
            marginTop: '8px',
            fontSize: '11px',
          }}
        >
          {/* Progress Bar */}
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '10px',
              }}
            >
              <span>
                STREAM PROGRESS:{' '}
                <strong>
                  {simState.processedRequests.toLocaleString()} /{' '}
                  {simState.totalRequests.toLocaleString()}
                </strong>{' '}
                ({Math.round((simState.processedRequests / Math.max(1, simState.totalRequests)) * 100)}%)
              </span>
              <span>
                Throughput: <strong style={{ color: '#10b981' }}>{simState.throughputRps} req/s</strong> | Latency: <strong>{simState.avgLatencyMs}ms</strong>
              </span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(
                    100,
                    Math.round(
                      (simState.processedRequests / Math.max(1, simState.totalRequests)) * 100
                    )
                  )}%`,
                  background: isSoldOut
                    ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                    : 'linear-gradient(90deg, #00e5ff, #10b981)',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '8px',
              fontSize: '11px',
            }}
          >
            <span>
              🟢 Real Tickets Bought:{' '}
              <strong style={{ color: '#10b981' }}>
                {simState.seatsAllocated || simState.normalAllowed}
              </strong>
            </span>
            <span>
              🔴 Bots Blocked (403):{' '}
              <strong style={{ color: '#ef4444' }}>{simState.botsBlocked}</strong>
            </span>
            <span>
              🎟️ Remaining Available Seats:{' '}
              <strong style={{ color: currentAvailableSeats === 0 ? '#ef4444' : '#00e5ff' }}>
                {currentAvailableSeats} / 500
              </strong>
            </span>
            {isSoldOut && (
              <span
                style={{
                  color: '#ef4444',
                  fontWeight: 'bold',
                  background: 'rgba(239, 68, 68, 0.15)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                }}
              >
                ⚠️ SOLD OUT: 0 DUPLICATES & 0 OVERSELLING
              </span>
            )}
          </div>

          {/* Real-time Incursion & Purchase Log */}
          {simState.recentLogs.length > 0 && (
            <div
              style={{
                maxHeight: '75px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '10px',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '6px 8px',
                borderRadius: '4px',
              }}
            >
              {simState.recentLogs.slice(0, 4).map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    color:
                      log.type === 'BOT_BLOCKED'
                        ? '#f87171'
                        : log.type === 'SOLD_OUT'
                        ? '#fbbf24'
                        : '#34d399',
                    marginBottom: '2px',
                  }}
                >
                  [{log.timestamp}] {log.status} - {log.userId}: {log.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AntiBotHUD;
