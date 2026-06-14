import { useState, useEffect, useCallback, useRef } from 'react';
import GroupsTab from './components/GroupsTab';
import LiveMatchesTab from './components/LiveMatchesTab';
import KnockoutTab from './components/KnockoutTab';
import TeamsTab from './components/TeamsTab';
import ScheduleTab from './components/ScheduleTab';
import {
  fetchAllMatches,
  prefetchAll,
  lastUpdatedLabel,
  canRetryNow,
  msUntilRetry,
  isLiveStatus,
  isFinishedStatus,
  FDMatch,
} from './services/footballData';

// ── Polling interval logic ────────────────────────────────────────────────────

type PollMode = 'live' | 'paused' | 'idle' | 'done';

function getPollMode(matches: FDMatch[]): PollMode {
  if (matches.some((m) => m.status === 'IN_PLAY')) return 'live';
  if (matches.some((m) => m.status === 'PAUSED')) return 'paused';
  if (matches.length > 0 && matches.every((m) => isFinishedStatus(m.status))) return 'done';
  return 'idle';
}

const POLL_INTERVALS: Record<PollMode, number | null> = {
  live:   60_000,  // 60 s — match in progress
  paused: 60_000,  // 60 s — half-time
  idle:   60_000,  // 60 s — no live matches
  done:   null,    // stop — all finished
};

// ── Countdown ─────────────────────────────────────────────────────────────────

const WC_START = new Date('2026-06-11T18:00:00Z');  // first match kick-off (2 PM ET Jun 11)
const WC_FINAL = new Date('2026-07-19T22:00:00Z');  // Final 6:00 PM ET = 22:00 UTC

type CountdownPhase = 'kickoff' | 'final';

function useSmartCountdown() {
  const getPhase = (): CountdownPhase => Date.now() >= WC_START.getTime() ? 'final' : 'kickoff';

  const [phase, setPhase] = useState<CountdownPhase>(getPhase);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const newPhase = now >= WC_START.getTime() ? 'final' : 'kickoff';
      setPhase(newPhase);
      const target = newPhase === 'kickoff' ? WC_START : WC_FINAL;
      const diff = target.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return { timeLeft, phase };
}

const TABS = [
  { id: 'teams',    label: 'TEAMS'    },
  { id: 'groups',   label: 'GROUPS'   },
  { id: 'schedule', label: 'SCHEDULE' },
  { id: 'live',     label: 'LIVE'     },
  { id: 'knockout', label: 'BRACKET'  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('teams');
  const [liveMatches, setLiveMatches] = useState<FDMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrySecsLeft, setRetrySecsLeft] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');
  const [pollMode, setPollMode] = useState<PollMode>('idle');
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const { timeLeft: countdown, phase: countdownPhase } = useSmartCountdown();

  const loadLiveMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const matches = await fetchAllMatches();
      setLiveMatches(matches);
      setLastUpdated(lastUpdatedLabel('wc_draw_matches'));
      setPollMode(getPollMode(matches));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live matches');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual retry with 60-second gate
  const handleRefresh = useCallback(() => {
    if (!canRetryNow()) return;
    loadLiveMatches();
    const remaining = () => Math.ceil(msUntilRetry() / 1000);
    setRetrySecsLeft(60);
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    retryTimerRef.current = setInterval(() => {
      const s = remaining();
      setRetrySecsLeft(s);
      if (s <= 0 && retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    }, 1000);
  }, [loadLiveMatches]);

  // Startup: prefetch then start smart polling
  useEffect(() => {
    (async () => {
      await prefetchAll();
      await loadLiveMatches();
    })();
    return () => {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
      if (pollTimerRef.current)  clearInterval(pollTimerRef.current);
    };
  }, [loadLiveMatches]);

  // Smart polling — re-registers whenever pollMode changes
  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    const interval = POLL_INTERVALS[pollMode];
    if (interval === null) return; // done — no more polling
    pollTimerRef.current = setInterval(loadLiveMatches, interval);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [pollMode, loadLiveMatches]);

  // Keep "last updated" label fresh every 30 s
  useEffect(() => {
    const id = setInterval(() => setLastUpdated(lastUpdatedLabel('wc_draw_matches')), 30_000);
    return () => clearInterval(id);
  }, []);

  const liveCount = liveMatches.filter((m) => isLiveStatus(m.status)).length;

  const countdownBlocks = [
    { value: countdown.days,    label: 'DAYS'    },
    { value: countdown.hours,   label: 'HOURS'   },
    { value: countdown.minutes, label: 'MINUTES' },
    { value: countdown.seconds, label: 'SECONDS' },
  ];
  const borderColors = ['#E3000B', '#0057A8', '#6B2D8B', '#00A850'];

  return (
    <div className="min-h-screen bg-wc-black font-inter">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: '3px solid #000000', boxShadow: '0 4px 0 rgba(0,0,0,0.07)' }}>
        {/* WC 2026 color-block stripe — purple / red / red / green / lime */}
        <div className="h-2 w-full flex">
          <div className="flex-1" style={{ backgroundColor: '#6B2D8B' }} />
          <div className="flex-1" style={{ backgroundColor: '#E3000B' }} />
          <div className="flex-1" style={{ backgroundColor: '#E3000B' }} />
          <div className="flex-1" style={{ backgroundColor: '#00A850' }} />
          <div className="flex-1" style={{ backgroundColor: '#C8D400' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo — official FIFA WC 2026 image */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <img
                src="/image.png"
                alt="FIFA World Cup 2026"
                className="h-12 w-auto object-contain block"
              />
              <div className="hidden sm:block w-[2px] h-9" style={{ backgroundColor: '#000000' }} />
              <div className="hidden sm:block leading-none">
                <p className="font-anton uppercase" style={{ fontSize: '10px', color: '#888888', letterSpacing: '0.28em' }}>
                  OFFICIAL TRACKER
                </p>
                <p className="font-anton" style={{ fontSize: '13px', color: '#000000', letterSpacing: '0.12em', marginTop: '4px' }}>
                  USA · CANADA · MEXICO
                </p>
              </div>
            </div>

            {/* Desktop nav — solid color-block style */}
            <nav className="hidden md:flex items-center gap-1.5">
              {TABS.map((tab, i) => {
                const isActive = activeTab === tab.id;
                const palette = ['#E3000B', '#6B2D8B', '#0057A8', '#00A850', '#C8D400'];
                const accent = palette[i % palette.length];
                const darkText = accent === '#C8D400';
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="font-anton text-xs tracking-widest transition-all duration-100 flex items-center gap-1.5"
                    style={{
                      padding: '7px 14px',
                      backgroundColor: isActive ? accent : 'transparent',
                      color: isActive ? (darkText ? '#000000' : '#ffffff') : '#111111',
                      border: `2px solid ${isActive ? accent : '#000000'}`,
                      boxShadow: isActive ? '3px 3px 0 #000000' : 'none',
                      transform: isActive ? 'translate(-2px,-2px)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = accent;
                        el.style.color = darkText ? '#000000' : '#ffffff';
                        el.style.borderColor = accent;
                        el.style.boxShadow = '3px 3px 0 #000000';
                        el.style.transform = 'translate(-2px,-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = 'transparent';
                        el.style.color = '#111111';
                        el.style.borderColor = '#000000';
                        el.style.boxShadow = 'none';
                        el.style.transform = 'none';
                      }
                    }}
                  >
                    {tab.label}
                    {tab.id === 'live' && liveCount > 0 && (
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 font-bold rounded-full animate-pulse"
                        style={{
                          fontSize: '9px',
                          backgroundColor: isActive ? '#ffffff' : '#E3000B',
                          color: isActive ? '#E3000B' : '#ffffff',
                        }}
                      >
                        {liveCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5"
                style={{ border: '2px solid #000000' }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: '#E3000B' }} />
                <span className="font-anton tracking-widest uppercase" style={{ fontSize: '10px', color: '#000000' }}>
                  LIVE DATA
                </span>
              </div>
              {liveCount > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5"
                  style={{ backgroundColor: '#E3000B', border: '2px solid #000000', boxShadow: '3px 3px 0 #000000' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="font-anton text-white text-xs tracking-widest">LIVE</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="flex md:hidden" style={{ borderTop: '2px solid #000000' }}>
            {TABS.map((tab, i) => {
              const isActive = activeTab === tab.id;
              const palette = ['#E3000B', '#6B2D8B', '#0057A8', '#00A850', '#C8D400'];
              const accent = palette[i % palette.length];
              const darkText = accent === '#C8D400';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 py-2.5 font-anton text-xs tracking-widest transition-all duration-100"
                  style={{
                    backgroundColor: isActive ? accent : 'transparent',
                    color: isActive ? (darkText ? '#000000' : '#ffffff') : '#777777',
                    borderRight: i < TABS.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#0e1a2b' }}>
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ animation: 'hero-spin 20s linear infinite' }}
        >
          {[
            '#E3000B', '#0057A8', '#6B2D8B', '#00A850',
            '#C8D400', '#E3000B', '#0057A8', '#6B2D8B',
            '#00A850', '#C8D400', '#E3000B', '#0057A8',
            '#6B2D8B', '#00A850', '#C8D400', '#E3000B',
          ].map((color, i) => {
            const size = 110 - i * 6;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  width: `${size}vmax`,
                  height: `${size}vmax`,
                  border: `${Math.max(3, 12 - i)}px solid ${color}`,
                  opacity: 0.85 - i * 0.025,
                }}
              />
            );
          })}
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 65%, transparent 100%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <div
            className="inline-block px-8 py-6 mb-2"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          >
            <h1
              className="font-inter text-white uppercase leading-tight"
              style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 900, letterSpacing: '0.05em' }}
            >
              FIFA WORLD CUP 2026
            </h1>
            <p className="font-inter text-white/75 mt-1" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '0.12em' }}>
              USA · Canada · Mexico · June 11 – July 19
            </p>
          </div>
        </div>

        <div className="relative pb-10 md:pb-14">
          <p
            className="font-inter text-white/50 tracking-[0.4em] text-xs text-center mb-5 uppercase"
            style={{ fontWeight: 600 }}
          >
            {countdownPhase === 'final'
              ? 'COUNTDOWN TO THE FINAL 🏆 · MetLife Stadium, New Jersey'
              : 'Countdown to Kickoff'}
          </p>
          <div className="grid grid-cols-4 gap-3 md:gap-5 max-w-xl mx-auto px-4">
            {countdownBlocks.map(({ value, label }, i) => (
              <div key={label} className="text-center">
                <div
                  style={{
                    background: '#ffffff',
                    borderBottom: `4px solid ${borderColors[i]}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    padding: '14px 8px 12px',
                  }}
                >
                  <span
                    className="font-inter leading-none block text-wc-black"
                    style={{ fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 900 }}
                  >
                    {String(value).padStart(2, '0')}
                  </span>
                </div>
                <p
                  className="font-inter text-white/60 tracking-[0.3em] text-xs mt-2 uppercase"
                  style={{ fontWeight: 600 }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
          {countdownPhase === 'final' && (
            <p className="font-inter text-white/30 text-xs text-center mt-5 tracking-widest uppercase" style={{ fontWeight: 600 }}>
              July 19, 2026 · 6:00 PM ET
            </p>
          )}
        </div>
      </section>

      {/* ── NEON SEPARATOR ─────────────────────────────────── */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, #E3000B 0%, #6B2D8B 25%, #0057A8 50%, #00A850 75%, #C8D400 100%)' }} />

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <div style={{ backgroundColor: '#0e1a2b' }}>
        <main className="max-w-7xl mx-auto px-4 py-10">
        {activeTab === 'teams'    && <TeamsTab liveMatches={liveMatches} />}
        {activeTab === 'groups'   && <GroupsTab liveMatches={liveMatches} />}
        {activeTab === 'schedule' && <ScheduleTab liveMatches={liveMatches} />}
        {activeTab === 'live'     && (
          <LiveMatchesTab
            liveMatches={liveMatches}
            isLoading={isLoading}
            error={error}
            lastUpdated={lastUpdated}
            retrySecsLeft={retrySecsLeft}
            pollMode={pollMode}
            onRefresh={handleRefresh}
          />
        )}
        {activeTab === 'knockout' && <KnockoutTab liveMatches={liveMatches} />}
      </main>
      </div>
      <footer>
        {/* Rainbow top border */}
        <div className="h-1 w-full flex">
          {['#E3000B','#6B2D8B','#0057A8','#00A850','#C8D400','#E3000B'].map((c) => (
            <div key={c} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>

        <div style={{ backgroundColor: '#111827' }} className="px-6 py-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Column 1 — About */}
            <div style={{ borderTop: '3px solid #E3000B', paddingTop: '16px' }}>
              <p className="font-inter" style={{ fontSize: '20px', fontWeight: 900, color: '#E3000B', letterSpacing: '0.04em', marginBottom: '10px' }}>
                WC2026.my
              </p>
              <p className="font-inter leading-relaxed" style={{ color: '#cccccc', fontSize: '14px', fontWeight: 400 }}>
                AI-powered FIFA World Cup 2026 tracker with live scores, standings and predictions.
              </p>
            </div>

            {/* Column 2 — Quick Links */}
            <div style={{ borderTop: '3px solid #0057A8', paddingTop: '16px' }}>
              <p className="font-inter uppercase mb-4" style={{ color: '#ffffff', fontWeight: 800, fontSize: '13px', letterSpacing: '0.15em' }}>
                Quick Links
              </p>
              <ul className="space-y-2">
                {[
                  { label: 'Teams',    tab: 'teams'    },
                  { label: 'Groups',   tab: 'groups'   },
                  { label: 'Schedule', tab: 'schedule' },
                  { label: 'Live',     tab: 'live'     },
                  { label: 'Bracket',  tab: 'knockout' },
                ].map(({ label, tab }) => (
                  <li key={tab}>
                    <button
                      onClick={() => setActiveTab(tab)}
                      className="font-inter transition-colors duration-150"
                      style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#C8D400')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 — Info */}
            <div style={{ borderTop: '3px solid #6B2D8B', paddingTop: '16px' }}>
              <p className="font-inter uppercase mb-4" style={{ color: '#ffffff', fontWeight: 800, fontSize: '13px', letterSpacing: '0.15em' }}>
                About
              </p>
              <ul className="space-y-2">
                {[
                  'AI Predictions updated in real time',
                  'Live scores via RapidAPI',
                  'Built for football fans worldwide',
                ].map((line) => (
                  <li key={line} className="font-inter" style={{ color: '#ffffff', fontSize: '14px', fontWeight: 400 }}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 — Creator */}
            <div style={{ borderTop: '3px solid #C8D400', paddingTop: '16px' }}>
              <p className="font-inter uppercase mb-4" style={{ color: '#ffffff', fontWeight: 800, fontSize: '13px', letterSpacing: '0.15em' }}>
                Creator
              </p>
              <p className="font-inter mb-3" style={{ color: '#00A850', fontSize: '20px', fontWeight: 900 }}>
                Created by Rafales
              </p>
              <p className="font-inter mb-1" style={{ color: '#C8D400', fontSize: '13px', fontWeight: 500 }}>
                rafalesofficial@gmail.com
              </p>
              <p className="font-inter mb-4" style={{ color: '#C8D400', fontSize: '13px', fontWeight: 500 }}>
                +994 51 968 19 96
              </p>
              <p className="font-inter" style={{ color: '#ffffff', fontSize: '13px', fontWeight: 400 }}>
                Built with passion for football ⚽
              </p>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ backgroundColor: '#0e1a2b', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="px-6 py-4">
          <p className="font-inter text-center" style={{ color: '#6b7280', fontSize: '12px', fontWeight: 400 }}>
            <span>© 2026 wc2026.my</span>
            <span style={{ color: '#E3000B', margin: '0 8px' }}>●</span>
            <span>Not affiliated with FIFA</span>
            <span style={{ color: '#0057A8', margin: '0 8px' }}>●</span>
            <span>For entertainment purposes only</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
