import { useState, useCallback, useEffect } from 'react';
import {
  fetchAllMatches,
  FDMatch,
  getFlag,
  isLiveStatus,
  isFinishedStatus,
} from '../services/footballData';
import { useInterval } from '../hooks/useInterval';
import TeamModal, { TeamInfo } from './TeamModal';

// Confederation badge colors (bg, text)
const CONF_STYLE: Record<string, { bg: string; label: string }> = {
  UEFA:     { bg: '#0057A8', label: 'UEFA'     },
  CONMEBOL: { bg: '#00A850', label: 'CONMEBOL' },
  CAF:      { bg: '#E3000B', label: 'CAF'      },
  AFC:      { bg: '#6B2D8B', label: 'AFC'      },
  CONCACAF: { bg: '#C8D400', label: 'CONCACAF' },
};

const TEAM_CODE: Record<string, string> = {
  'Mexico':'MEX','South Africa':'RSA','South Korea':'KOR','Czechia':'CZE',
  'Canada':'CAN','Bosnia & Herzegovina':'BIH','Qatar':'QAT','Switzerland':'SUI',
  'Brazil':'BRA','Morocco':'MAR','Scotland':'SCO','Haiti':'HAI',
  'USA':'USA','Paraguay':'PAR','Australia':'AUS','Turkey':'TUR',
  'Germany':'GER','Curaçao':'CUW','Ivory Coast':'CIV','Ecuador':'ECU',
  'Netherlands':'NED','Japan':'JPN','Sweden':'SWE','Tunisia':'TUN',
  'Belgium':'BEL','Egypt':'EGY','Iran':'IRN','New Zealand':'NZL',
  'Spain':'ESP','Cape Verde':'CPV','Saudi Arabia':'KSA','Uruguay':'URU',
  'France':'FRA','Senegal':'SEN','Iraq':'IRQ','Norway':'NOR',
  'Argentina':'ARG','Algeria':'ALG','Austria':'AUT','Jordan':'JOR',
  'Portugal':'POR','DR Congo':'COD','Uzbekistan':'UZB','Colombia':'COL',
  'Croatia':'CRO','England':'ENG','Ghana':'GHA','Panama':'PAN',
};

interface Team {
  name: string;
  flag: string;
  conf: string;
}

interface Group {
  id: string;
  teams: Team[];
  accentHex: string;
}

const GROUPS: Group[] = [
  { id:'A', accentHex:'#E3000B',
    teams:[{name:'Mexico',flag:'🇲🇽',conf:'CONCACAF'},{name:'South Africa',flag:'🇿🇦',conf:'CAF'},{name:'South Korea',flag:'🇰🇷',conf:'AFC'},{name:'Czechia',flag:'🇨🇿',conf:'UEFA'}] },
  { id:'B', accentHex:'#0057A8',
    teams:[{name:'Canada',flag:'🇨🇦',conf:'CONCACAF'},{name:'Bosnia & Herzegovina',flag:'🇧🇦',conf:'UEFA'},{name:'Qatar',flag:'🇶🇦',conf:'AFC'},{name:'Switzerland',flag:'🇨🇭',conf:'UEFA'}] },
  { id:'C', accentHex:'#6B2D8B',
    teams:[{name:'Brazil',flag:'🇧🇷',conf:'CONMEBOL'},{name:'Morocco',flag:'🇲🇦',conf:'CAF'},{name:'Haiti',flag:'🇭🇹',conf:'CONCACAF'},{name:'Scotland',flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',conf:'UEFA'}] },
  { id:'D', accentHex:'#00A850',
    teams:[{name:'USA',flag:'🇺🇸',conf:'CONCACAF'},{name:'Paraguay',flag:'🇵🇾',conf:'CONMEBOL'},{name:'Australia',flag:'🇦🇺',conf:'AFC'},{name:'Turkey',flag:'🇹🇷',conf:'UEFA'}] },
  { id:'E', accentHex:'#C8D400',
    teams:[{name:'Germany',flag:'🇩🇪',conf:'UEFA'},{name:'Curaçao',flag:'🇨🇼',conf:'CONCACAF'},{name:'Ivory Coast',flag:'🇨🇮',conf:'CAF'},{name:'Ecuador',flag:'🇪🇨',conf:'CONMEBOL'}] },
  { id:'F', accentHex:'#E3000B',
    teams:[{name:'Netherlands',flag:'🇳🇱',conf:'UEFA'},{name:'Japan',flag:'🇯🇵',conf:'AFC'},{name:'Sweden',flag:'🇸🇪',conf:'UEFA'},{name:'Tunisia',flag:'🇹🇳',conf:'CAF'}] },
  { id:'G', accentHex:'#0057A8',
    teams:[{name:'Belgium',flag:'🇧🇪',conf:'UEFA'},{name:'Egypt',flag:'🇪🇬',conf:'CAF'},{name:'Iran',flag:'🇮🇷',conf:'AFC'},{name:'New Zealand',flag:'🇳🇿',conf:'AFC'}] },
  { id:'H', accentHex:'#6B2D8B',
    teams:[{name:'Spain',flag:'🇪🇸',conf:'UEFA'},{name:'Cape Verde',flag:'🇨🇻',conf:'CAF'},{name:'Saudi Arabia',flag:'🇸🇦',conf:'AFC'},{name:'Uruguay',flag:'🇺🇾',conf:'CONMEBOL'}] },
  { id:'I', accentHex:'#00A850',
    teams:[{name:'France',flag:'🇫🇷',conf:'UEFA'},{name:'Senegal',flag:'🇸🇳',conf:'CAF'},{name:'Iraq',flag:'🇮🇶',conf:'AFC'},{name:'Norway',flag:'🇳🇴',conf:'UEFA'}] },
  { id:'J', accentHex:'#C8D400',
    teams:[{name:'Argentina',flag:'🇦🇷',conf:'CONMEBOL'},{name:'Algeria',flag:'🇩🇿',conf:'CAF'},{name:'Austria',flag:'🇦🇹',conf:'UEFA'},{name:'Jordan',flag:'🇯🇴',conf:'AFC'}] },
  { id:'K', accentHex:'#E3000B',
    teams:[{name:'Portugal',flag:'🇵🇹',conf:'UEFA'},{name:'DR Congo',flag:'🇨🇩',conf:'CAF'},{name:'Uzbekistan',flag:'🇺🇿',conf:'AFC'},{name:'Colombia',flag:'🇨🇴',conf:'CONMEBOL'}] },
  { id:'L', accentHex:'#0057A8',
    teams:[{name:'England',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',conf:'UEFA'},{name:'Croatia',flag:'🇭🇷',conf:'UEFA'},{name:'Ghana',flag:'🇬🇭',conf:'CAF'},{name:'Panama',flag:'🇵🇦',conf:'CONCACAF'}] },
];

type TeamStatus =
  | { type: 'live'; score: string; minute: number | null }
  | { type: 'today'; kickoff: string }
  | { type: 'advanced' }
  | { type: 'eliminated' }
  | { type: 'idle' };

function fuzzyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const al = (a ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const bl = (b ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (!al || !bl) return false;
  return al.includes(bl.slice(0, 5)) || bl.includes(al.slice(0, 5));
}

function isToday(utcDate: string): boolean {
  const d = new Date(utcDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function getTeamStatus(teamName: string, liveMatches: FDMatch[], allMatches: FDMatch[]): TeamStatus {
  const live = liveMatches.find(
    (m) => isLiveStatus(m.status) && (fuzzyMatch(teamName, m.homeTeam.name) || fuzzyMatch(teamName, m.awayTeam.name))
  );
  if (live) {
    const isHome = fuzzyMatch(teamName, live.homeTeam.name);
    const my = isHome ? (live.score.fullTime.home ?? 0) : (live.score.fullTime.away ?? 0);
    const op = isHome ? (live.score.fullTime.away ?? 0) : (live.score.fullTime.home ?? 0);
    return { type: 'live', score: `${my}:${op}`, minute: live.minute ?? null };
  }
  const todayMatch = allMatches.find(
    (m) => (m.status === 'SCHEDULED' || m.status === 'TIMED') && isToday(m.utcDate) &&
      (fuzzyMatch(teamName, m.homeTeam.name) || fuzzyMatch(teamName, m.awayTeam.name))
  );
  if (todayMatch) {
    return { type: 'today', kickoff: new Date(todayMatch.utcDate).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) };
  }
  const inKnockout = allMatches.some((m) => {
   const stage = String(m.stage ?? '').toUpperCase();
    return (fuzzyMatch(teamName, m.homeTeam.name) || fuzzyMatch(teamName, m.awayTeam.name)) &&
      (stage.includes('LAST') || stage.includes('QUARTER') || stage.includes('SEMI') || stage === 'FINAL');
  });
  if (inKnockout) return { type: 'advanced' };
  const groupDone = allMatches.filter(
   (m) => isFinishedStatus(m.status) && String(m.stage ?? '').toUpperCase().includes('GROUP') &&
      (fuzzyMatch(teamName, m.homeTeam.name) || fuzzyMatch(teamName, m.awayTeam.name))
  );
  if (groupDone.length >= 3) return { type: 'eliminated' };
  return { type: 'idle' };
}

interface Props {
  liveMatches: FDMatch[];
}

export default function TeamsTab({ liveMatches }: Props) {
  const [allMatches, setAllMatches] = useState<FDMatch[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null);

  const liveTeamNames = liveMatches.flatMap((m) => [m.homeTeam?.name, m.awayTeam?.name]).filter(Boolean) as string[];

  const handleTeamClick = (team: Team, group: Group) => {
    setSelectedTeam({
      name: team.name,
      flag: team.flag,
      conf: team.conf,
      group: group.id,
      headerBg: '',
      headerHex: group.accentHex,
    });
  };

  const loadMatches = useCallback(async () => {
    try {
      const data = await fetchAllMatches();
      setAllMatches(data);
    } catch { /* keep stale */ }
  }, []);

  useEffect(() => { loadMatches(); }, [loadMatches]);
  useInterval(loadMatches, 5 * 60_000);

  return (
    <div>
      {/* Section heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-1.5 self-stretch" style={{ background: 'linear-gradient(180deg,#E3000B,#0057A8)' }} />
          <div>
            <h2
              className="font-anton text-white uppercase leading-none tracking-wider"
              style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}
            >
              ALL 48 TEAMS
            </h2>
            <p className="font-inter text-gray-500 text-xs font-semibold tracking-[0.2em] uppercase mt-1">
              12 GROUPS · USA, CANADA, MEXICO
            </p>
          </div>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-inter text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-wc-red animate-pulse" />LIVE
          </span>
          <span className="flex items-center gap-1.5 font-inter text-xs text-gray-400">
            <span className="text-yellow-400 font-bold">⏰</span>Today
          </span>
          <span className="flex items-center gap-1.5 font-inter text-xs text-gray-400">
            <span className="text-green-400 font-bold">✓</span>Advanced
          </span>
          <span className="flex items-center gap-1.5 font-inter text-xs text-gray-500">
            <span className="text-gray-500 font-bold">✕</span>Eliminated
          </span>
        </div>
      </div>

      {/* Confederation legend */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.entries(CONF_STYLE).map(([conf, style]) => (
          <span
            key={conf}
            className="font-inter font-bold text-white text-xs tracking-widest uppercase px-3 py-1.5"
            style={{ backgroundColor: style.bg, borderRadius: 3 }}
          >
            {conf}
          </span>
        ))}
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {GROUPS.map((group) => (
          <div
            key={group.id}
            className="dark-grain overflow-hidden"
            style={{
              backgroundColor: '#111827',
              borderTop: `3px solid ${group.accentHex}`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.06)`,
            }}
          >
            {/* Group header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: `linear-gradient(90deg, ${group.accentHex}22 0%, transparent 100%)` }}
            >
              <span className="font-inter text-gray-400 text-xs font-semibold tracking-[0.3em] uppercase">Group</span>
              <span
                className="font-anton text-white leading-none"
                style={{ fontSize: '2.5rem', color: group.accentHex, textShadow: `0 0 20px ${group.accentHex}60` }}
              >
                {group.id}
              </span>
            </div>

            {/* Team rows */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {group.teams.map((team, i) => {
                const status = getTeamStatus(team.name, liveMatches, allMatches);
                const isLive = status.type === 'live';
                const isElim = status.type === 'eliminated';
                const isAdv  = status.type === 'advanced';
                const isToday_ = status.type === 'today';
                const conf = CONF_STYLE[team.conf];

                return (
                  <button
                    key={team.name}
                    onClick={() => handleTeamClick(team, group)}
                    className="relative w-full text-left flex items-center gap-3 px-4 py-3 transition-all group/row"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      backgroundColor: isLive ? 'rgba(227,0,11,0.1)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isElim) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = isLive
                          ? 'rgba(227,0,11,0.18)'
                          : 'rgba(255,255,255,0.05)';
                        (e.currentTarget as HTMLElement).style.borderLeft = `3px solid ${group.accentHex}`;
                        (e.currentTarget as HTMLElement).style.paddingLeft = '13px';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = isLive ? 'rgba(227,0,11,0.1)' : 'transparent';
                      (e.currentTarget as HTMLElement).style.borderLeft = '';
                      (e.currentTarget as HTMLElement).style.paddingLeft = '16px';
                    }}
                  >
                    {isElim && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                        <span className="font-anton text-gray-400 text-xs tracking-[0.3em] uppercase">ELIMINATED</span>
                      </div>
                    )}

                    {/* Rank badge */}
                    <span
                      className="font-anton text-xs w-6 h-6 flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: i < 2 ? group.accentHex : 'rgba(255,255,255,0.08)',
                        color: i < 2 ? '#fff' : '#555',
                      }}
                    >
                      {i + 1}
                    </span>

                    <span className="text-xl leading-none flex-shrink-0">{team.flag}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-inter font-bold uppercase tracking-wider"
                          style={{ color: i < 2 ? '#ffffff' : '#666666', fontSize: 13 }}
                        >
                          {TEAM_CODE[team.name] ?? team.name.slice(0, 3).toUpperCase()}
                        </span>
                        {isLive && status.type === 'live' && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-wc-red animate-pulse" />
                            <span className="font-anton text-wc-red text-xs leading-none">
                              {status.score}{status.minute !== null ? ` · ${status.minute}'` : ''}
                            </span>
                          </span>
                        )}
                      </div>

                      {isAdv && (
                        <span className="font-inter text-green-400 text-xs font-bold mt-0.5 block">✓ ADVANCED</span>
                      )}
                    </div>

                    {/* Confederation badge */}
                    {conf && (
                      <span
                        className="font-inter font-bold flex-shrink-0"
                        style={{
                          backgroundColor: conf.bg,
                          color: conf.bg === '#C8D400' ? '#000000' : '#ffffff',
                          fontSize: '9px',
                          letterSpacing: '0.05em',
                          padding: '2px 5px',
                          borderRadius: 2,
                        }}
                      >
                        {team.conf}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          liveTeamNames={liveTeamNames}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}
