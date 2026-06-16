import { RefreshCw, Clock } from 'lucide-react';
import { FDMatch, getFlag, isLiveStatus } from '../services/footballData';

type PollMode = 'live' | 'paused' | 'idle' | 'done';

// ── Static next-match data (for "no live" state) ─────────────────────────────

interface NextMatch {
  home: string; homeFlag: string;
  away: string; awayFlag: string;
  date: string; timeET: string;
  stadium: string; city: string;
}

const UPCOMING_FIXTURES: NextMatch[] = [
  { home:'South Korea', homeFlag:'🇰🇷', away:'Czechia',              awayFlag:'🇨🇿', date:'2026-06-12', timeET:'9:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas'             },
  { home:'Canada',      homeFlag:'🇨🇦', away:'Bosnia & Herzegovina', awayFlag:'🇧🇦', date:'2026-06-12', timeET:'6:00 PM ET',  stadium:'BC Place',                city:'Vancouver'          },
  { home:'Qatar',       homeFlag:'🇶🇦', away:'Switzerland',          awayFlag:'🇨🇭', date:'2026-06-12', timeET:'3:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey'},
  { home:'Brazil',      homeFlag:'🇧🇷', away:'Morocco',              awayFlag:'🇲🇦', date:'2026-06-13', timeET:'9:00 PM ET',  stadium:'Rose Bowl',               city:'Los Angeles'        },
  { home:'Haiti',       homeFlag:'🇭🇹', away:'Scotland',             awayFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', date:'2026-06-13', timeET:'3:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas'             },
  { home:'USA',         homeFlag:'🇺🇸', away:'Paraguay',             awayFlag:'🇵🇾', date:'2026-06-14', timeET:'6:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles'        },
  { home:'Australia',   homeFlag:'🇦🇺', away:'Turkey',               awayFlag:'🇹🇷', date:'2026-06-14', timeET:'9:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas'             },
  { home:'Germany',     homeFlag:'🇩🇪', away:'Curaçao',              awayFlag:'🇨🇼', date:'2026-06-14', timeET:'3:00 PM ET',  stadium:'Lincoln Financial Field', city:'Philadelphia'       },
];

function getNextMatch(): NextMatch | null {
  const now = Date.now();
  for (const f of UPCOMING_FIXTURES) {
    const matchTime = new Date(`${f.date}T00:00:00-04:00`).getTime();
    if (matchTime > now) return f;
  }
  return UPCOMING_FIXTURES[UPCOMING_FIXTURES.length - 1];
}

function daysHoursUntil(dateStr: string): string {
  const target = new Date(`${dateStr}T00:00:00-04:00`).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return 'Today';
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `in ${h}h`;
  const d = Math.floor(h / 24);
  return `in ${d}d`;
}

// ── Win probability bar ───────────────────────────────────────────────────────

function calcProbs(homeScore: number, awayScore: number, minute: number) {
  const s1 = homeScore || 0;
  const s2 = awayScore || 0;
  const progress = Math.min(minute / 90, 0.95);
  const uncertainty = 1 - progress;
  const diff = s1 - s2;
  let w1 = 33, w2 = 33, draw = 34;
  if (diff > 0) {
    const adv = Math.min(diff * 20, 60);
    w1 = 33 + adv - uncertainty * 20; w2 = Math.max(33 - adv, 10); draw = 100 - w1 - w2;
  } else if (diff < 0) {
    const adv = Math.min(Math.abs(diff) * 20, 60);
    w2 = 33 + adv - uncertainty * 20; w1 = Math.max(33 - adv, 10); draw = 100 - w1 - w2;
  } else {
    draw = 50 - progress * 20; w1 = 25 + uncertainty * 15; w2 = 25 + uncertainty * 15;
  }
  const t = w1 + w2 + draw;
  return { w1: Math.round(w1 / t * 100), w2: Math.round(w2 / t * 100), draw: Math.round(draw / t * 100) };
}

const ACCENT_COLORS = ['#E3000B', '#0057A8', '#6B2D8B', '#00A850'];

interface Props {
  liveMatches: FDMatch[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string;
  retrySecsLeft: number;
  pollMode: PollMode;
  onRefresh: () => void;
}

export default function LiveMatchesTab({ liveMatches, isLoading, error, lastUpdated, retrySecsLeft, pollMode, onRefresh }: Props) {
  const liveNow = liveMatches.filter((m) => isLiveStatus(m.status));
  const nextMatch = getNextMatch();

  // Initial loading state
  if (isLoading && liveMatches.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={32} style={{ color: '#E3000B' }} />
          <p className="font-anton text-gray-400 tracking-widest text-sm uppercase">Checking for live matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-1.5 self-stretch"
            style={{ background: 'linear-gradient(180deg,#E3000B,#6B2D8B)', minHeight: 52 }}
          />
          <div>
            <h2
              className="font-anton text-white uppercase tracking-wider leading-none"
              style={{ fontSize: 'clamp(28px, 5vw, 52px)' }}
            >
              LIVE MATCHES
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              {pollMode === 'live' || pollMode === 'paused' ? (
                <span className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: '#E3000B' }} />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#4b5563' }} />
              )}
              <span className="font-inter text-xs font-semibold tracking-widest uppercase" style={{ color: '#9ca3af' }}>
                {pollMode === 'live'   ? 'Refreshing every 60s'  :
                 pollMode === 'paused' ? 'Refreshing every 60s'  :
                 pollMode === 'done'   ? 'All matches finished'   :
                 'Auto-refreshing every 60s'}
              </span>
              {lastUpdated && (
                <span className="font-inter text-xs hidden sm:inline" style={{ color: '#4b5563' }}>
                  · updated {lastUpdated}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading || retrySecsLeft > 0}
          className="flex items-center gap-2 font-anton text-xs tracking-widest uppercase transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            padding: '8px 16px',
            border: '2px solid rgba(255,255,255,0.15)',
            color: '#9ca3af',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => { if (!isLoading && retrySecsLeft <= 0) { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E3000B'; el.style.color = '#E3000B'; } }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.15)'; el.style.color = '#9ca3af'; }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'UPDATING' : retrySecsLeft > 0 ? `${retrySecsLeft}s` : 'REFRESH'}
        </button>
      </div>

      {/* ── Live matches or "no live" state ────────────────────────────────── */}
      {liveNow.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {liveNow.map((match, idx) => {
            const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            const homeScore = match.score.fullTime.home ?? 0;
            const awayScore = match.score.fullTime.away ?? 0;
            const probs = calcProbs(homeScore, awayScore, match.minute ?? 45);
            const homeName = match.homeTeam.shortName || match.homeTeam.name;
            const awayName = match.awayTeam.shortName || match.awayTeam.name;

            return (
              <div
                key={match.id}
                className="overflow-hidden"
                style={{
                  backgroundColor: 'rgba(227,0,11,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderTop: `3px solid ${accent}`,
                  borderLeft: '4px solid #E3000B',
                }}
              >
                {/* Live badge bar */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ backgroundColor: '#E3000B' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="font-anton text-white text-xs tracking-[0.3em]">🔴 LIVE</span>
                  </div>
                  {match.minute != null && (
                    <span className="font-anton text-white text-sm font-black">{match.minute}'</span>
                  )}
                  {match.status === 'PAUSED' && (
                    <span className="font-anton text-white text-xs tracking-widest">HALF TIME</span>
                  )}
                </div>

                {/* Score */}
                <div className="px-6 py-6 flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <span className="text-4xl block mb-2">{getFlag(match.homeTeam.name)}</span>
                    <p
                      className="font-inter font-black text-white leading-tight uppercase tracking-wider"
                      style={{ fontSize: homeName.length > 8 ? '11px' : '13px' }}
                    >
                      {homeName}
                    </p>
                  </div>

                  <div className="text-center flex-shrink-0">
                    <div
                      className="font-anton text-white leading-none tabular-nums"
                      style={{ fontSize: '4rem', letterSpacing: '-0.02em' }}
                    >
                      <span>{homeScore}</span>
                      <span className="mx-2" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '3rem' }}>—</span>
                      <span>{awayScore}</span>
                    </div>
                    {match.minute != null && (
                      <p
                        className="font-inter text-xs font-bold mt-1 tracking-widest"
                        style={{ color: '#E3000B' }}
                      >
                        {match.minute}'
                      </p>
                    )}
                  </div>

                  <div className="flex-1 text-center">
                    <span className="text-4xl block mb-2">{getFlag(match.awayTeam.name)}</span>
                    <p
                      className="font-inter font-black text-white leading-tight uppercase tracking-wider"
                      style={{ fontSize: awayName.length > 8 ? '11px' : '13px' }}
                    >
                      {awayName}
                    </p>
                  </div>
                </div>

                {/* Win probability */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex h-1.5">
                    <div className="h-full" style={{ width: `${probs.w1}%`, backgroundColor: '#00A850' }} />
                    <div className="h-full" style={{ width: `${probs.draw}%`, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <div className="h-full" style={{ width: `${probs.w2}%`, backgroundColor: '#E3000B' }} />
                  </div>
                  <div className="px-4 py-3 grid grid-cols-3 text-center">
                    <div>
                      <p className="font-anton text-white text-lg leading-none">{probs.w1}%</p>
                      <p className="font-inter text-xs uppercase tracking-wide mt-0.5" style={{ color: '#4b5563' }}>{homeName.slice(0, 3)}</p>
                    </div>
                    <div>
                      <p className="font-anton text-lg leading-none" style={{ color: '#6b7280' }}>{probs.draw}%</p>
                      <p className="font-inter text-xs uppercase tracking-wide mt-0.5" style={{ color: '#4b5563' }}>Draw</p>
                    </div>
                    <div>
                      <p className="font-anton text-white text-lg leading-none">{probs.w2}%</p>
                      <p className="font-inter text-xs uppercase tracking-wide mt-0.5" style={{ color: '#4b5563' }}>{awayName.slice(0, 3)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── No live matches state ───────────────────────────────────────── */
        <div>
          {/* Big "no live" message */}
          <div
            className="py-16 px-8 text-center mb-6"
            style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#111827' }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.1)' }}
            >
              <Clock size={28} style={{ color: '#4b5563' }} />
            </div>
            <p className="font-anton text-white tracking-widest text-2xl mb-2">NO LIVE MATCHES RIGHT NOW</p>
            <p className="font-inter text-sm" style={{ color: '#4b5563' }}>
              Live matches will appear here automatically. Page refreshes every{' '}
              {pollMode === 'idle' ? '60 seconds' : '60 seconds'}.
            </p>

            {/* Error notice (quota / network) */}
            {error && (
              <div
                className="mt-6 px-4 py-3 mx-auto max-w-sm text-left"
                style={{ backgroundColor: 'rgba(227,0,11,0.08)', border: '1px solid rgba(227,0,11,0.2)' }}
              >
                <p className="font-inter text-xs font-semibold" style={{ color: '#E3000B' }}>
                  API notice: {error}
                </p>
              </div>
            )}
          </div>

          
        </div>
      )}

      {/* ── Recently finished ──────────────────────────────────────────────── */}
      {liveMatches.filter(m => m.status === 'FINISHED').length > 0 && liveNow.length === 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <span className="font-anton text-xs tracking-[0.3em] uppercase" style={{ color: '#4b5563' }}>
              RECENT RESULTS
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveMatches.filter(m => m.status === 'FINISHED').slice(0, 6).map((match) => {
              const homeScore = match.score.fullTime.home ?? 0;
              const awayScore = match.score.fullTime.away ?? 0;
              const homeWon = homeScore > awayScore;
              const awayWon = awayScore > homeScore;
              return (
                <div
                  key={match.id}
                  className="px-4 py-4"
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderTop: '3px solid #4b5563',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-anton text-xs tracking-widest" style={{ color: '#4b5563' }}>FT</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 flex items-center gap-2 ${!homeWon ? 'opacity-50' : ''}`}>
                      <span className="text-2xl">{getFlag(match.homeTeam.name)}</span>
                      <span className="font-inter font-bold text-white text-sm uppercase">
                        {match.homeTeam.tla || match.homeTeam.name.slice(0, 3)}
                      </span>
                    </div>
                    <span
                      className="font-anton text-white text-2xl leading-none tabular-nums font-black"
                    >
                      {homeScore}
                      <span className="mx-1" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                      {awayScore}
                    </span>
                    <div className={`flex-1 flex items-center justify-end gap-2 ${!awayWon ? 'opacity-50' : ''}`}>
                      <span className="font-inter font-bold text-white text-sm uppercase">
                        {match.awayTeam.tla || match.awayTeam.name.slice(0, 3)}
                      </span>
                      <span className="text-2xl">{getFlag(match.awayTeam.name)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
