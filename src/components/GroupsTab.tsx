import { useState, useCallback, useEffect } from 'react';
import {
  fetchStandings,
  fetchGroupDraw,
  FDMatch, FDStandingGroup, FDStandingRow,
  isLiveStatus, parseGroupLetter,
  GroupDraw,
} from '../services/footballData';
import { useInterval } from '../hooks/useInterval';

const TEAM_CODE: Record<string, { code: string; flag: string }> = {
  'Mexico':                { code: 'MEX', flag: '🇲🇽' },
  'South Africa':          { code: 'RSA', flag: '🇿🇦' },
  'South Korea':           { code: 'KOR', flag: '🇰🇷' },
  'Czechia':               { code: 'CZE', flag: '🇨🇿' },
  'Canada':                { code: 'CAN', flag: '🇨🇦' },
  'Bosnia & Herzegovina':  { code: 'BIH', flag: '🇧🇦' },
  'Qatar':                 { code: 'QAT', flag: '🇶🇦' },
  'Switzerland':           { code: 'SUI', flag: '🇨🇭' },
  'Brazil':                { code: 'BRA', flag: '🇧🇷' },
  'Morocco':               { code: 'MAR', flag: '🇲🇦' },
  'Scotland':              { code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'Haiti':                 { code: 'HAI', flag: '🇭🇹' },
  'USA':                   { code: 'USA', flag: '🇺🇸' },
  'United States':         { code: 'USA', flag: '🇺🇸' },
  'Paraguay':              { code: 'PAR', flag: '🇵🇾' },
  'Australia':             { code: 'AUS', flag: '🇦🇺' },
  'Turkey':                { code: 'TUR', flag: '🇹🇷' },
  'Germany':               { code: 'GER', flag: '🇩🇪' },
  'Curaçao':               { code: 'CUW', flag: '🇨🇼' },
  'Curacao':               { code: 'CUW', flag: '🇨🇼' },
  'Ivory Coast':           { code: 'CIV', flag: '🇨🇮' },
  "Côte d'Ivoire":         { code: 'CIV', flag: '🇨🇮' },
  'Cote d\'Ivoire':        { code: 'CIV', flag: '🇨🇮' },
  'Ecuador':               { code: 'ECU', flag: '🇪🇨' },
  'Netherlands':           { code: 'NED', flag: '🇳🇱' },
  'Japan':                 { code: 'JPN', flag: '🇯🇵' },
  'Sweden':                { code: 'SWE', flag: '🇸🇪' },
  'Tunisia':               { code: 'TUN', flag: '🇹🇳' },
  'Belgium':               { code: 'BEL', flag: '🇧🇪' },
  'Egypt':                 { code: 'EGY', flag: '🇪🇬' },
  'Iran':                  { code: 'IRN', flag: '🇮🇷' },
  'New Zealand':           { code: 'NZL', flag: '🇳🇿' },
  'Spain':                 { code: 'ESP', flag: '🇪🇸' },
  'Cape Verde':            { code: 'CPV', flag: '🇨🇻' },
  'Saudi Arabia':          { code: 'KSA', flag: '🇸🇦' },
  'Uruguay':               { code: 'URU', flag: '🇺🇾' },
  'France':                { code: 'FRA', flag: '🇫🇷' },
  'Senegal':               { code: 'SEN', flag: '🇸🇳' },
  'Iraq':                  { code: 'IRQ', flag: '🇮🇶' },
  'Norway':                { code: 'NOR', flag: '🇳🇴' },
  'Argentina':             { code: 'ARG', flag: '🇦🇷' },
  'Algeria':               { code: 'ALG', flag: '🇩🇿' },
  'Austria':               { code: 'AUT', flag: '🇦🇹' },
  'Jordan':                { code: 'JOR', flag: '🇯🇴' },
  'Portugal':              { code: 'POR', flag: '🇵🇹' },
  'DR Congo':              { code: 'COD', flag: '🇨🇩' },
  'Uzbekistan':            { code: 'UZB', flag: '🇺🇿' },
  'Colombia':              { code: 'COL', flag: '🇨🇴' },
  'Croatia':               { code: 'CRO', flag: '🇭🇷' },
  'England':               { code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'Ghana':                 { code: 'GHA', flag: '🇬🇭' },
  'Panama':                { code: 'PAN', flag: '🇵🇦' },
};

function getTeamCode(name: string | null | undefined): { code: string; flag: string } {
  if (!name) return { code: '???', flag: '🏳' };
  if (TEAM_CODE[name]) return TEAM_CODE[name];
  // Fuzzy fallback: find by prefix
  const nl = name.toLowerCase().replace(/[^a-z]/g, '');
  const match = Object.entries(TEAM_CODE).find(([k]) => {
    const kl = k.toLowerCase().replace(/[^a-z]/g, '');
    return nl.includes(kl.slice(0, 5)) || kl.includes(nl.slice(0, 5));
  });
  return match ? match[1] : { code: name.slice(0, 3).toUpperCase(), flag: '🏳' };
}

// Group accent colors cycling through WC 2026 palette
const GROUP_ACCENTS = [
  '#E3000B', '#6B2D8B', '#0057A8', '#00A850',
  '#C8D400', '#E3000B', '#6B2D8B', '#0057A8',
  '#00A850', '#C8D400', '#E3000B', '#6B2D8B',
];

const STATIC_GROUPS: Record<string, { name: string; flag: string }[]> = {
  A: [{ name: 'Mexico', flag: '🇲🇽' }, { name: 'South Africa', flag: '🇿🇦' }, { name: 'South Korea', flag: '🇰🇷' }, { name: 'Czechia', flag: '🇨🇿' }],
  B: [{ name: 'Canada', flag: '🇨🇦' }, { name: 'Bosnia & Herzegovina', flag: '🇧🇦' }, { name: 'Qatar', flag: '🇶🇦' }, { name: 'Switzerland', flag: '🇨🇭' }],
  C: [{ name: 'Brazil', flag: '🇧🇷' }, { name: 'Morocco', flag: '🇲🇦' }, { name: 'Haiti', flag: '🇭🇹' }, { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' }],
  D: [{ name: 'USA', flag: '🇺🇸' }, { name: 'Paraguay', flag: '🇵🇾' }, { name: 'Australia', flag: '🇦🇺' }, { name: 'Turkey', flag: '🇹🇷' }],
  E: [{ name: 'Germany', flag: '🇩🇪' }, { name: 'Curaçao', flag: '🇨🇼' }, { name: 'Ivory Coast', flag: '🇨🇮' }, { name: 'Ecuador', flag: '🇪🇨' }],
  F: [{ name: 'Netherlands', flag: '🇳🇱' }, { name: 'Japan', flag: '🇯🇵' }, { name: 'Sweden', flag: '🇸🇪' }, { name: 'Tunisia', flag: '🇹🇳' }],
  G: [{ name: 'Belgium', flag: '🇧🇪' }, { name: 'Egypt', flag: '🇪🇬' }, { name: 'Iran', flag: '🇮🇷' }, { name: 'New Zealand', flag: '🇳🇿' }],
  H: [{ name: 'Spain', flag: '🇪🇸' }, { name: 'Cape Verde', flag: '🇨🇻' }, { name: 'Saudi Arabia', flag: '🇸🇦' }, { name: 'Uruguay', flag: '🇺🇾' }],
  I: [{ name: 'France', flag: '🇫🇷' }, { name: 'Senegal', flag: '🇸🇳' }, { name: 'Iraq', flag: '🇮🇶' }, { name: 'Norway', flag: '🇳🇴' }],
  J: [{ name: 'Argentina', flag: '🇦🇷' }, { name: 'Algeria', flag: '🇩🇿' }, { name: 'Austria', flag: '🇦🇹' }, { name: 'Jordan', flag: '🇯🇴' }],
  K: [{ name: 'Portugal', flag: '🇵🇹' }, { name: 'DR Congo', flag: '🇨🇩' }, { name: 'Uzbekistan', flag: '🇺🇿' }, { name: 'Colombia', flag: '🇨🇴' }],
  L: [{ name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, { name: 'Croatia', flag: '🇭🇷' }, { name: 'Ghana', flag: '🇬🇭' }, { name: 'Panama', flag: '🇵🇦' }],
};

// Filter pill definitions — exact colors from spec
interface FilterDef { label: string; bg: string; activeBg: string }
const FILTER_DEFS: FilterDef[] = [
  { label: 'ALL',        bg: '#333333', activeBg: '#4a4a4a' },
  { label: 'EUROPE',     bg: '#0057A8', activeBg: '#0068cc' },
  { label: 'AMERICAS',   bg: '#00A850', activeBg: '#00c460' },
  { label: 'ASIA/AFRICA',bg: '#6B2D8B', activeBg: '#8B3DB0' },
];

const CONF_FILTER: Record<string, string[]> = {
  EUROPE:      ['UEFA'],
  AMERICAS:    ['CONMEBOL', 'CONCACAF'],
  'ASIA/AFRICA': ['AFC', 'CAF'],
};

const TEAM_CONF: Record<string, string> = {
  Mexico:'CONCACAF','South Africa':'CAF','South Korea':'AFC',Czechia:'UEFA',
  Canada:'CONCACAF','Bosnia & Herzegovina':'UEFA',Qatar:'AFC',Switzerland:'UEFA',
  Brazil:'CONMEBOL',Morocco:'CAF',Haiti:'CONCACAF',Scotland:'UEFA',
  USA:'CONCACAF',Paraguay:'CONMEBOL',Australia:'AFC',Turkey:'UEFA',
  Germany:'UEFA','Curaçao':'CONCACAF','Ivory Coast':'CAF',Ecuador:'CONMEBOL',
  Netherlands:'UEFA',Japan:'AFC',Sweden:'UEFA',Tunisia:'CAF',
  Belgium:'UEFA',Egypt:'CAF',Iran:'AFC','New Zealand':'AFC',
  Spain:'UEFA','Cape Verde':'CAF','Saudi Arabia':'AFC',Uruguay:'CONMEBOL',
  France:'UEFA',Senegal:'CAF',Iraq:'AFC',Norway:'UEFA',
  Argentina:'CONMEBOL',Algeria:'CAF',Austria:'UEFA',Jordan:'AFC',
  Portugal:'UEFA','DR Congo':'CAF',Uzbekistan:'AFC',Colombia:'CONMEBOL',
  England:'UEFA',Croatia:'UEFA',Ghana:'CAF',Panama:'CONCACAF',
};

function fuzzyTeamName(a: string | null | undefined, b: string | null | undefined): boolean {
  const al = (a ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const bl = (b ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (!al || !bl) return false;
  return al.includes(bl.slice(0, 5)) || bl.includes(al.slice(0, 5));
}

function findLiveForTeam(teamName: string, liveMatches: FDMatch[]): FDMatch | null {
  return liveMatches.find(
    (m) => isLiveStatus(m.status) && (
      fuzzyTeamName(teamName, m.homeTeam.name) ||
      fuzzyTeamName(teamName, m.awayTeam.name)
    )
  ) ?? null;
}

interface Props {
  liveMatches: FDMatch[];
}

export default function GroupsTab({ liveMatches }: Props) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [standingGroups, setStandingGroups] = useState<FDStandingGroup[]>([]);
  const [draw, setDraw] = useState<GroupDraw>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [standings, drawData] = await Promise.all([fetchStandings(), fetchGroupDraw()]);
      setStandingGroups(standings);
      setDraw(drawData);
    } catch {
      // silently keep stale data — never show error screen
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useInterval(load, 60_000);

  const standingsMap: Record<string, FDStandingRow[]> = {};
  for (const grp of standingGroups) {
    const letter = parseGroupLetter(grp.group);
    if (letter) {
      standingsMap[letter] = [...grp.table].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
    }
  }

  const groupLetters = Object.keys(STATIC_GROUPS) as string[];
  const visibleGroups = activeFilter === 'ALL'
    ? groupLetters
    : groupLetters.filter((letter) => {
        const teams = STATIC_GROUPS[letter] ?? [];
        const allowed = CONF_FILTER[activeFilter] ?? [];
        return teams.some((t) => allowed.includes(TEAM_CONF[t.name] ?? ''));
      });

  return (
    <div>
      {/* Section heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-1.5 self-stretch" style={{ background: 'linear-gradient(180deg,#0057A8,#00A850)' }} />
          <div>
            <h2
              className="font-anton text-white uppercase leading-none tracking-wider"
              style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}
            >
              GROUP STAGE
            </h2>
            <p className="font-inter text-gray-500 text-xs font-semibold tracking-[0.2em] uppercase mt-1">
              48 TEAMS · 12 GROUPS
            </p>
          </div>
        </div>
      </div>

      {/* Filter pills — spec-exact */}
      <div className="flex gap-2.5 mb-8 overflow-x-auto pb-1 flex-wrap">
        {FILTER_DEFS.map((f) => {
          const isActive = activeFilter === f.label;
          return (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.label)}
              style={{
                backgroundColor: isActive ? f.activeBg : f.bg,
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '1px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                color: '#ffffff',
                border: isActive ? '2px solid #ffffff' : '2px solid transparent',
                opacity: isActive ? 1 : 0.7,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'opacity 0.15s, border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
                boxShadow: isActive ? `0 0 12px ${f.activeBg}80` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 8px ${f.bg}60`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.opacity = '0.7';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && standingGroups.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-wc-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-anton text-gray-500 tracking-widest text-sm uppercase">Loading standings…</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {visibleGroups.map((letter, idx) => {
          const accent = GROUP_ACCENTS[idx % GROUP_ACCENTS.length];
          const apiRows = standingsMap[letter] ?? [];
          const staticTeams = STATIC_GROUPS[letter] ?? [];
          // Prefer draw API data → standings API names → static fallback
          const drawTeams = draw[letter] ?? [];

          const rows: { name: string; flag: string; row: FDStandingRow | null }[] = apiRows.length > 0
            ? apiRows.map((r) => {
                const tc = getTeamCode(r.team.name);
                return { name: r.team.name, flag: tc.flag, row: r };
              })
            : drawTeams.length > 0
            ? drawTeams.map((t) => ({ name: t.name, flag: getTeamCode(t.name).flag, row: null }))
            : staticTeams.map((t) => ({ name: t.name, flag: getTeamCode(t.name).flag, row: null }));

          const hasStats = apiRows.length > 0;

          return (
            <div
              key={letter}
              className="dark-grain overflow-hidden flex flex-col"
              style={{
                backgroundColor: '#111827',
                borderTop: `3px solid ${accent}`,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              {/* Header */}
              <div
                className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                style={{ background: `linear-gradient(90deg, ${accent}22 0%, transparent 100%)` }}
              >
                <span className="font-inter text-gray-400 text-xs font-semibold tracking-[0.3em] uppercase">Group</span>
                <span
                  className="font-anton leading-none"
                  style={{ fontSize: '2.25rem', color: accent, textShadow: `0 0 18px ${accent}55` }}
                >
                  {letter}
                </span>
              </div>

              {/* Stats header */}
              {hasStats && (
                <div
                  className="px-2 py-1 grid items-center flex-shrink-0"
                  style={{
                    gridTemplateColumns: 'auto 72px repeat(6, 22px)',
                    columnGap: '4px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <span className="w-5" />
                  <span className="font-anton text-gray-600 text-xs tracking-wider">TEAM</span>
                  {['MP','W','D','L','GD','PTS'].map((h) => (
                    <span key={h} className="font-anton text-gray-600 text-xs text-center tracking-wider">{h}</span>
                  ))}
                </div>
              )}

              {/* Rows */}
              <div className="flex-1">
                {rows.map(({ name, flag, row }, i) => {
                  const qualified = i < 2;
                  const liveMatch = findLiveForTeam(name, liveMatches);
                  const isLive = liveMatch !== null;

                  let liveScore = '';
                  if (isLive && liveMatch) {
                    const isHome = fuzzyTeamName(name, liveMatch.homeTeam.name);
                    const my = isHome ? (liveMatch.score.fullTime.home ?? 0) : (liveMatch.score.fullTime.away ?? 0);
                    const op = isHome ? (liveMatch.score.fullTime.away ?? 0) : (liveMatch.score.fullTime.home ?? 0);
                    liveScore = `${my}:${op}`;
                  }

                  return (
                    <div
                      key={name}
                      className="flex items-center px-2 py-2 last:border-b-0"
                      style={{
                        ...(hasStats ? {
                          display: 'grid',
                          gridTemplateColumns: 'auto 72px repeat(6, 22px)',
                          columnGap: '4px',
                          alignItems: 'center',
                        } : {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }),
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderLeft: qualified ? `3px solid ${accent}` : '3px solid transparent',
                        backgroundColor: isLive ? 'rgba(227,0,11,0.08)' : 'transparent',
                      }}
                    >
                      <span
                        className="font-anton text-xs w-5 h-5 flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: qualified ? accent : 'rgba(255,255,255,0.06)',
                          color: qualified ? '#fff' : '#555',
                        }}
                      >
                        {i + 1}
                      </span>

                      {/* Flag + 3-letter code */}
                      <div className="flex items-center gap-1.5 min-w-0" style={{ width: 72 }}>
                        <span className="text-base leading-none flex-shrink-0">{flag}</span>
                        <span
                          className="font-inter font-bold uppercase tracking-wider truncate"
                          style={{ color: qualified ? '#ffffff' : '#555555', fontSize: 13 }}
                        >
                          {getTeamCode(name).code}
                        </span>
                        {isLive && (
                          <span className="flex items-center gap-0.5 bg-wc-red px-1 py-0.5 flex-shrink-0">
                            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                            <span className="font-anton text-white leading-none" style={{ fontSize: 9 }}>{liveScore}</span>
                          </span>
                        )}
                      </div>

                      {hasStats && row && (
                        <>
                          {[row.playedGames, row.won, row.draw, row.lost, row.goalDifference, row.points].map((val, si) => (
                            <span
                              key={si}
                              className="font-anton text-center leading-none"
                              style={{
                                color: si === 5
                                  ? qualified ? accent : '#555'
                                  : '#555',
                                fontSize: si === 5 ? 13 : 11,
                                width: 22,
                                textAlign: 'center',
                              }}
                            >
                              {si === 4 && (val as number) > 0 ? `+${val}` : val}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
