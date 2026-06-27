import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, Users, BarChart2, MessageSquare, Info } from 'lucide-react';
import {
  FDMatch,
  GoalEvent,
  MatchStatItem,
  MatchLineup,
  CommentaryEvent,
  fetchMatchDetail,
  fetchMatchStats,
  fetchMatchLineups,
  fetchMatchCommentary,
  getFlag,
  isLiveStatus,
  isFinishedStatus,
} from '../services/footballData';

interface StaticInfo {
  home: string;
  homeFlag: string;
  away: string;
  awayFlag: string;
  date: string;
  timeET: string;
  stadium: string;
  city: string;
  stage: string;
  group: string;
  matchNum: number;
}

interface Props {
  matchId: number | null;
  staticInfo: StaticInfo | null;
  apiMatch: FDMatch | null;
  onClose: () => void;
}

type Tab = 'overview' | 'stats' | 'lineups' | 'commentary';

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', 'own-goal': '⚽', penalty: '⚽',
  yellowcard: '🟨', redcard: '🟥', yellowredcard: '🟧',
  substitution: '🔄', var: '📺',
};

function eventIcon(type: string): string {
  const t = type.toLowerCase().replace(/[-_\s]/g, '');
  for (const [k, v] of Object.entries(EVENT_ICONS)) {
    if (t.includes(k.replace(/[-_]/g, ''))) return v;
  }
  return '•';
}

function StatusBadge({ match }: { match: FDMatch | null }) {
  if (!match) return null;
  if (isLiveStatus(match.status)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1" style={{ backgroundColor: '#E3000B' }}>
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="font-anton text-white text-sm tracking-widest">
          LIVE{match.minute != null ? ` · ${match.minute}'` : ''}
        </span>
      </span>
    );
  }
  if (isFinishedStatus(match.status)) {
    return <span className="font-anton tracking-widest" style={{ color: '#9ca3af', fontSize: 13 }}>FULL TIME</span>;
  }
  return <span className="font-anton tracking-widest" style={{ color: '#555', fontSize: 13 }}>UPCOMING</span>;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#E3000B', borderTopColor: 'transparent' }} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-14 text-center px-6">
      <p className="font-inter text-gray-600 text-sm">{message}</p>
    </div>
  );
}

// ── Goal scorers display for finished matches ─────────────────────────────────

function GoalScorers({
  goals, homeTeam, awayTeam, homeFlag, awayFlag,
  homeScore, awayScore,
}: {
  goals: GoalEvent[];
  homeTeam: string; awayTeam: string;
  homeFlag: string; awayFlag: string;
  homeScore: number; awayScore: number;
}) {
  const homeGoals = goals.filter((g) => g.team === 'home');
  const awayGoals = goals.filter((g) => g.team === 'away');
  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Home side */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{homeFlag}</span>
            <span className="font-anton text-white text-xs uppercase tracking-wide">{homeTeam}</span>
            <span className="font-anton ml-auto" style={{ color: '#00A850', fontSize: 18 }}>{homeScore}</span>
          </div>
          {homeGoals.length > 0 ? (
            homeGoals.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-xs">⚽</span>
                <span className="font-inter text-sm text-white flex-1">{g.scorer}</span>
                <span className="font-inter text-xs text-gray-500 flex-shrink-0">
                  {g.minute ? `${g.minute}'` : ''}{g.type === 'own-goal' ? ' OG' : g.type === 'penalty' ? ' P' : ''}
                </span>
              </div>
            ))
          ) : (
            <p className="font-inter text-xs text-gray-600 py-1">—</p>
          )}
        </div>
        {/* Away side */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{awayFlag}</span>
            <span className="font-anton text-white text-xs uppercase tracking-wide">{awayTeam}</span>
            <span className="font-anton ml-auto" style={{ color: '#E3000B', fontSize: 18 }}>{awayScore}</span>
          </div>
          {awayGoals.length > 0 ? (
            awayGoals.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-xs">⚽</span>
                <span className="font-inter text-sm text-white flex-1">{g.scorer}</span>
                <span className="font-inter text-xs text-gray-500 flex-shrink-0">
                  {g.minute ? `${g.minute}'` : ''}{g.type === 'own-goal' ? ' OG' : g.type === 'penalty' ? ' P' : ''}
                </span>
              </div>
            ))
          ) : (
            <p className="font-inter text-xs text-gray-600 py-1">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

function OverviewTab({
  info, match, homeFlag, awayFlag,
}: {
  info: StaticInfo | null;
  match: FDMatch | null;
  homeFlag: string; awayFlag: string;
}) {
  const finished = isFinishedStatus(match?.status ?? '');
  const homeScore = match?.score.fullTime.home ?? null;
  const awayScore = match?.score.fullTime.away ?? null;
  const htHome = match?.score.halfTime.home;
  const htAway = match?.score.halfTime.away;
  const hasGoals = (match?.goals?.length ?? 0) > 0;

  const items = [
    { label: 'Date',    value: info ? new Date(info.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
    { label: 'Kickoff', value: info?.timeET ?? '—' },
    { label: 'Venue',   value: info?.stadium ? `${info.stadium}, ${info.city}` : '—' },
    { label: 'Stage',   value: info?.stage ?? match?.stage ?? '—' },
    ...(info?.group ? [{ label: 'Group', value: `Group ${info.group}` }] : []),
    ...(htHome != null && htAway != null ? [{ label: 'Half-time', value: `${htHome} – ${htAway}` }] : []),
  ];

  return (
    <div>
      {/* Final score block for finished matches */}
      {finished && homeScore !== null && awayScore !== null && (
        <div className="mx-4 mt-4 mb-3 p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="font-inter text-xs text-gray-500 uppercase tracking-widest text-center mb-3 font-semibold">Final Score</p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{homeFlag}</span>
              <span className="font-anton text-white text-sm uppercase">{info?.home ?? match?.homeTeam.name}</span>
            </div>
            <span className="font-anton text-white" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
              {homeScore}<span className="text-gray-600 mx-1.5">–</span>{awayScore}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-anton text-white text-sm uppercase">{info?.away ?? match?.awayTeam.name}</span>
              <span className="text-2xl">{awayFlag}</span>
            </div>
          </div>
          {htHome != null && htAway != null && (
            <p className="text-center font-inter text-xs text-gray-600 mt-2">Half-time: {htHome} – {htAway}</p>
          )}
        </div>
      )}

      {/* Goal scorers */}
      {finished && hasGoals && match && (
        <div className="mx-4 mb-3" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-inter text-xs text-gray-500 uppercase tracking-widest px-3 py-2 font-semibold"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            Goal Scorers
          </p>
          <div className="p-3">
            <GoalScorers
              goals={match.goals!}
              homeTeam={info?.home ?? match.homeTeam.name}
              awayTeam={info?.away ?? match.awayTeam.name}
              homeFlag={homeFlag} awayFlag={awayFlag}
              homeScore={homeScore!} awayScore={awayScore!}
            />
          </div>
        </div>
      )}

      {/* Match info rows */}
      <div className="px-4 pb-4 space-y-0">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="font-inter text-xs text-gray-500 uppercase tracking-widest font-semibold flex-shrink-0">{label}</span>
            <span className="font-inter text-sm text-white font-medium text-right ml-4">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsTab({ matchId, isFinished, match, info, homeFlag, awayFlag }: {
  matchId: number;
  isFinished: boolean;
  match: FDMatch | null;
  info: StaticInfo | null;
  homeFlag: string; awayFlag: string;
}) {
  const [stats, setStats] = useState<MatchStatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMatchStats(matchId).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [matchId]);

  const homeScore = match?.score.fullTime.home ?? null;
  const awayScore = match?.score.fullTime.away ?? null;
  const hasScore  = homeScore !== null && awayScore !== null;

  if (loading) return <Spinner />;

  // For finished matches with no stats API data — show score + scorers prominently
  if (stats.length === 0) {
    if (isFinished && hasScore) {
      return (
        <div className="p-4">
          <div className="py-6 text-center mb-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-center gap-6 mb-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">{homeFlag}</span>
                <span className="font-anton text-white text-xs uppercase">{info?.home ?? match?.homeTeam.name}</span>
              </div>
              <span className="font-anton text-white" style={{ fontSize: '3rem', lineHeight: 1 }}>
                {homeScore}<span className="text-gray-600 mx-2">–</span>{awayScore}
              </span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">{awayFlag}</span>
                <span className="font-anton text-white text-xs uppercase">{info?.away ?? match?.awayTeam.name}</span>
              </div>
            </div>
            <span className="font-anton tracking-widest text-xs" style={{ color: '#9ca3af' }}>FULL TIME</span>
          </div>
          {match?.goals && match.goals.length > 0 && (
            <GoalScorers
              goals={match.goals}
              homeTeam={info?.home ?? match.homeTeam.name}
              awayTeam={info?.away ?? match.awayTeam.name}
              homeFlag={homeFlag} awayFlag={awayFlag}
              homeScore={homeScore} awayScore={awayScore}
            />
          )}
          <p className="font-inter text-xs text-gray-600 text-center mt-4">Detailed stats not available for this match</p>
        </div>
      );
    }
    return <EmptyState message={isFinished ? 'Stats not available for this match' : 'Stats available after kick-off'} />;
  }

  const STAT_ICONS: Record<string, string> = {
    Possession: '⚽', Shots: '🎯', 'Shots on Target': '🎯',
    Corners: '📐', Fouls: '⚠️', 'Yellow Cards': '🟨', 'Red Cards': '🟥',
    Offsides: '🚩', Saves: '🧤', Passes: '📊',
  };

  return (
    <div className="p-4">
      {/* Team headers */}
      <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{homeFlag}</span>
          <span className="font-anton text-white text-xs uppercase">{info?.home ?? match?.homeTeam.name ?? 'Home'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-anton text-white text-xs uppercase">{info?.away ?? match?.awayTeam.name ?? 'Away'}</span>
          <span className="text-xl">{awayFlag}</span>
        </div>
      </div>

      <div className="space-y-2">
        {stats.map((stat) => {
          const hVal = stat.home ?? 0;
          const aVal = stat.away ?? 0;
          const hNum = parseFloat(String(hVal)) || 0;
          const aNum = parseFloat(String(aVal)) || 0;
          const total = hNum + aNum || 1;
          const hPct = Math.round((hNum / total) * 100);
          const aPct = 100 - hPct;
          return (
            <div key={stat.type} className="py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-anton text-white text-sm">{String(hVal)}</span>
                <span className="font-inter text-xs text-gray-500 tracking-wider uppercase">
                  {STAT_ICONS[stat.type] ?? ''} {stat.type}
                </span>
                <span className="font-anton text-white text-sm">{String(aVal)}</span>
              </div>
              <div className="flex h-1.5 overflow-hidden" style={{ borderRadius: 2 }}>
                <div style={{ width: `${hPct}%`, backgroundColor: '#0057A8', transition: 'width 0.3s' }} />
                <div style={{ width: `${aPct}%`, backgroundColor: '#E3000B', transition: 'width 0.3s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Lineups ───────────────────────────────────────────────────────────────────

function PlayerRow({ player }: { player: { id: number; name: string; number: number | null; position: string | null } }) {
  return (
    <div className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="font-anton text-xs w-6 text-center flex-shrink-0" style={{ color: '#555' }}>
        {player.number ?? '—'}
      </span>
      <span className="font-inter text-sm text-white flex-1">{player.name || '—'}</span>
      {player.position && (
        <span className="font-anton text-xs px-1.5 py-0.5 flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#888' }}>
          {player.position}
        </span>
      )}
    </div>
  );
}

function LineupsTab({ matchId, info, match }: {
  matchId: number;
  info: StaticInfo | null;
  match: FDMatch | null;
}) {
  const [lineup, setLineup] = useState<MatchLineup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMatchLineups(matchId).then((l) => {
      setLineup(l);
      setLoading(false);
    });
  }, [matchId]);

  if (loading) return <Spinner />;
  if (!lineup || (lineup.homeStartXI.length === 0 && lineup.awayStartXI.length === 0)) {
    return <EmptyState message="Lineups not yet available" />;
  }

  const homeLabel = lineup.homeTeam || info?.home || match?.homeTeam.name || 'Home';
  const awayLabel = lineup.awayTeam || info?.away || match?.awayTeam.name || 'Away';
  const hFlag = getFlag(lineup.homeTeam || info?.home);
  const aFlag = getFlag(lineup.awayTeam || info?.away);

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: homeLabel, flag: hFlag, xi: lineup.homeStartXI, subs: lineup.homeSubs, formation: lineup.homeFormation },
          { label: awayLabel, flag: aFlag, xi: lineup.awayStartXI, subs: lineup.awaySubs, formation: lineup.awayFormation },
        ].map(({ label, flag, xi, subs, formation }) => (
          <div key={label}>
            <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              <span className="text-xl">{flag}</span>
              <div>
                <p className="font-anton text-white text-sm uppercase tracking-wide">{label}</p>
                {formation && <p className="font-inter text-xs text-gray-500">{formation}</p>}
              </div>
            </div>
            <p className="font-inter text-xs text-gray-500 uppercase tracking-widest mb-1 font-semibold">Starting XI</p>
            {xi.length > 0
              ? xi.map((p) => <PlayerRow key={p.id || p.name} player={p} />)
              : <p className="font-inter text-xs text-gray-600 py-2">Not available</p>}
            {subs.length > 0 && (
              <>
                <p className="font-inter text-xs text-gray-500 uppercase tracking-widest mt-3 mb-1 font-semibold">Substitutes</p>
                {subs.map((p) => <PlayerRow key={p.id || p.name} player={p} />)}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Commentary ────────────────────────────────────────────────────────────────

function CommentaryTab({ matchId }: { matchId: number }) {
  const [events, setEvents] = useState<CommentaryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchMatchCommentary(matchId).then((e) => {
      setEvents(e);
      setLoading(false);
    });
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (events.length === 0) return <EmptyState message="Commentary not yet available" />;

  return (
    <div className="p-4 space-y-0">
      {[...events].reverse().map((ev, i) => {
        const isGoal = ev.type.includes('goal');
        const isCard = ev.type.includes('card');
        return (
          <div
            key={i}
            className="flex gap-3 py-3"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              backgroundColor: isGoal ? 'rgba(0,168,80,0.06)' : 'transparent',
            }}
          >
            <div className="flex-shrink-0 w-10 text-center">
              <span className="font-anton text-xs" style={{ color: isGoal ? '#00A850' : isCard ? '#E3000B' : '#555' }}>
                {ev.minute ? `${ev.minute}'` : ''}
              </span>
            </div>
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="text-sm flex-shrink-0 mt-0.5">{eventIcon(ev.type)}</span>
              <p className="font-inter text-sm leading-snug" style={{ color: isGoal ? '#ffffff' : '#9ca3af' }}>
                {ev.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function MatchDetailModal({ matchId, staticInfo, apiMatch: initialApiMatch, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [liveMatch, setLiveMatch] = useState<FDMatch | null>(initialApiMatch);

  // Fetch detail on open — always, not just for live matches
  useEffect(() => {
    if (!matchId) return;
    fetchMatchDetail(matchId).then((m) => {
      if (m) setLiveMatch(m);
    });
    // Only keep polling if live
  }, [matchId]);

  // Live polling
  useEffect(() => {
    if (!matchId || !isLiveStatus(liveMatch?.status ?? '')) return;
    const id = setInterval(() => {
      fetchMatchDetail(matchId).then((m) => { if (m) setLiveMatch(m); });
    }, 30_000);
    return () => clearInterval(id);
  }, [matchId, liveMatch?.status]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const match    = liveMatch ?? initialApiMatch;
  const homeFlag = staticInfo?.homeFlag ?? getFlag(match?.homeTeam.name);
  const awayFlag = staticInfo?.awayFlag ?? getFlag(match?.awayTeam.name);
  const homeName = staticInfo?.home ?? match?.homeTeam.name ?? 'Home';
  const awayName = staticInfo?.away ?? match?.awayTeam.name ?? 'Away';
  const homeScore = match?.score.fullTime.home ?? null;
  const awayScore = match?.score.fullTime.away ?? null;
  const hasScore  = homeScore !== null && awayScore !== null;
  const live      = isLiveStatus(match?.status ?? '');
  const finished  = isFinishedStatus(match?.status ?? '');

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',   label: 'INFO',     icon: <Info size={13} /> },
    { id: 'stats',      label: 'STATS',    icon: <BarChart2 size={13} /> },
    { id: 'lineups',    label: 'LINEUPS',  icon: <Users size={13} /> },
    { id: 'commentary', label: 'LOG',      icon: <MessageSquare size={13} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#0f1623',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div style={{
          backgroundColor: live ? 'rgba(227,0,11,0.1)' : '#111827',
          borderBottom: live ? '2px solid #E3000B' : '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              {staticInfo?.group && (
                <span className="font-anton text-xs tracking-widest" style={{ color: '#0057A8' }}>
                  GROUP {staticInfo.group}
                </span>
              )}
              {staticInfo?.matchNum && (
                <span className="font-anton text-xs text-gray-600 tracking-widest">
                  #{staticInfo.matchNum}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 transition-colors"
              style={{ color: '#555' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#fff')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#555')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Teams + score */}
          <div className="px-4 pb-4 flex items-center gap-2">
            <div className="flex-1 flex flex-col items-center text-center">
              <span className="text-4xl mb-1.5">{homeFlag}</span>
              <span className="font-inter font-bold text-white text-sm uppercase tracking-wide leading-tight">{homeName}</span>
            </div>
            <div className="flex-shrink-0 text-center px-3 min-w-[100px]">
              {hasScore ? (
                <div>
                  <span className="font-anton text-white leading-none" style={{ fontSize: '3rem' }}>
                    {homeScore}<span className="text-gray-700 mx-1.5">:</span>{awayScore}
                  </span>
                  <div className="mt-1.5 flex justify-center">
                    <StatusBadge match={match} />
                  </div>
                </div>
              ) : (
                <div>
                  <span className="font-inter text-gray-500 text-sm font-semibold block">{staticInfo?.timeET ?? '—'}</span>
                  <span className="font-anton text-gray-700 text-sm tracking-widest block mt-1">VS</span>
                  <div className="mt-1.5 flex justify-center"><StatusBadge match={match} /></div>
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col items-center text-center">
              <span className="text-4xl mb-1.5">{awayFlag}</span>
              <span className="font-inter font-bold text-white text-sm uppercase tracking-wide leading-tight">{awayName}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-anton text-xs tracking-widest transition-all"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: isActive ? '#ffffff' : '#555555',
                    borderBottom: isActive ? '2px solid #E3000B' : '2px solid transparent',
                  }}
                >
                  {t.icon}
                  {t.label}
                  {t.id === 'commentary' && live && (
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#E3000B' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
          {tab === 'overview' && (
            <OverviewTab info={staticInfo} match={match} homeFlag={homeFlag} awayFlag={awayFlag} />
          )}
          {tab === 'stats' && matchId ? (
            <StatsTab
              matchId={matchId}
              isFinished={finished}
              match={match}
              info={staticInfo}
              homeFlag={homeFlag}
              awayFlag={awayFlag}
            />
          ) : tab === 'stats' && (
            <EmptyState message={finished ? 'Stats not available' : 'Stats available after kick-off'} />
          )}
          {tab === 'lineups' && matchId ? (
            <LineupsTab matchId={matchId} info={staticInfo} match={match} />
          ) : tab === 'lineups' && (
            <EmptyState message="Lineups not yet available" />
          )}
          {tab === 'commentary' && matchId ? (
            <CommentaryTab matchId={matchId} />
          ) : tab === 'commentary' && (
            <EmptyState message="Commentary not yet available" />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-1.5 px-4 py-2.5 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#0a1120' }}
        >
          <span className="font-inter text-xs text-gray-600">WC 2026</span>
          <ChevronRight size={10} className="text-gray-700" />
          <span className="font-inter text-xs text-gray-600">{staticInfo?.stage ?? 'Match'}</span>
          {staticInfo?.group && (
            <>
              <ChevronRight size={10} className="text-gray-700" />
              <span className="font-inter text-xs text-gray-600">Group {staticInfo.group}</span>
            </>
          )}
          {matchId && (
            <>
              <ChevronRight size={10} className="text-gray-700 ml-auto" />
              <span className="font-inter text-xs text-gray-700">ID {matchId}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
