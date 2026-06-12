import { useEffect, useState, useCallback } from 'react';
import { X, Loader, ShieldAlert, AlertTriangle } from 'lucide-react';
import { fetchWikiSquad } from '../services/wikiSquads';
import { SQUADS } from '../data/squads';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeamInfo {
  name: string;
  flag: string;
  conf: string;
  group: string;
  headerBg: string;   // Tailwind class e.g. "bg-wc-red"
  headerHex: string;  // Actual hex for gradient
}

interface Player {
  number: number;
  name: string;
  club: string;
  age: number;
  caps: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
}

interface SquadData {
  coach: string;
  fifaRank: number;
  players: Player[];
}

// ── FIFA Ranking map ──────────────────────────────────────────────────────────

const FIFA_RANKS: Record<string, number> = {
  Argentina:1, France:2, Spain:3, England:4, Brazil:5,
  Portugal:6, Netherlands:7, Belgium:8, Germany:9,
  Morocco:12, USA:13, Mexico:15, Colombia:16, Uruguay:17,
  Japan:18, Croatia:19, Senegal:20, Switzerland:22, 'South Korea':23,
  Turkey:28, Australia:30, Norway:32, Algeria:35, Ecuador:36,
  Sweden:37, Qatar:37, Iran:38, Egypt:39, Tunisia:42,
  'Ivory Coast':43, Ghana:45, Paraguay:46, 'Saudi Arabia':55,
  'South Africa':66, 'New Zealand':96,
  // Estimated for WC 2026 teams not in official list
  Austria:25, Scotland:40, Czechia:34, Canada:48,
  'Bosnia & Herzegovina':60, Haiti:88, 'Curaçao':110,
  Iraq:66, 'DR Congo':65, Uzbekistan:73, Panama:74,
  'Cape Verde':80, Jordan:81,
};

function getSquad(teamName: string): SquadData {
  const squad = SQUADS[teamName];
  const fifaRank = FIFA_RANKS[teamName] ?? 80;
  if (squad) {
    return { coach: squad.coach, fifaRank, players: squad.players };
  }
  return { coach: 'Head Coach', fifaRank, players: [] };
}

// ── Position sections config ──────────────────────────────────────────────────

const POSITION_SECTIONS = [
  { pos: 'GK'  as const, label: '🧤 GOALKEEPERS' },
  { pos: 'DEF' as const, label: '🛡️ DEFENDERS'   },
  { pos: 'MID' as const, label: '⚙️ MIDFIELDERS'  },
  { pos: 'FWD' as const, label: '⚡ FORWARDS'     },
];

// ── Component ─────────────────────────────────────────────────────────────────

type DataSource = 'loading' | 'wikipedia' | 'fallback' | 'error';

interface Props {
  team: TeamInfo;
  liveTeamNames: string[];
  onClose: () => void;
}

export default function TeamModal({ team, liveTeamNames, onClose }: Props) {
  const fallback = getSquad(team.name);
  const [squad, setSquad] = useState<SquadData>(fallback);
  const [source, setSource] = useState<DataSource>(fallback.players.length > 0 ? 'fallback' : 'loading');

  const load = useCallback(async () => {
    try {
      const wiki = await fetchWikiSquad(team.name);
      if (wiki && wiki.players.length >= 11) {
        setSquad({
          coach: wiki.coach !== 'Head Coach' ? wiki.coach : fallback.coach,
          fifaRank: fallback.fifaRank,
          players: wiki.players,
        });
        setSource('wikipedia');
      } else {
        setSource(fallback.players.length > 0 ? 'fallback' : 'error');
      }
    } catch {
      setSource(fallback.players.length > 0 ? 'fallback' : 'error');
    }
  }, [team.name]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const headerColorStyle = team.headerHex ? { backgroundColor: team.headerHex } : {};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease' }}
      />

      {/* Panel — full screen on mobile, modal on sm+ */}
      <div
        className="relative w-full sm:max-w-2xl sm:max-h-[90vh] max-h-full flex flex-col bg-white sm:border-4 sm:border-wc-black"
        style={{ animation: 'slideUp 0.25s ease' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={headerColorStyle}
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">{team.flag}</span>
            <div>
              <h2 className="font-inter font-black text-white uppercase text-xl leading-tight tracking-wide" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                {team.name}
              </h2>
              <p className="font-inter text-white/75 text-xs font-semibold tracking-widest uppercase">
                Group {team.group} · {team.conf} · FIFA #{squad.fifaRank}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-black/25 hover:bg-black/40 transition text-white flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Coach strip */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-wc-black border-b-2 border-gray-800 flex-shrink-0">
          <ShieldAlert size={14} className="text-gray-400" />
          <span className="font-inter text-white/60 text-xs tracking-widest uppercase font-semibold">Coach</span>
          <span className="font-inter text-white font-bold text-sm ml-1">{squad.coach}</span>
          {source === 'wikipedia' && (
            <span className="ml-auto font-inter text-wc-green text-xs font-semibold">
              Wikipedia · live data
            </span>
          )}
          {source === 'error' && (
            <span className="ml-auto flex items-center gap-1 font-inter text-red-400 text-xs font-semibold">
              <AlertTriangle size={11} /> Unable to load squad data
            </span>
          )}
        </div>

        {/* Squad list — scrollable */}
        <div className="overflow-y-auto flex-1">
          {source === 'loading' && squad.players.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader className="animate-spin text-wc-blue" size={28} />
              <p className="font-inter text-gray-400 text-xs tracking-widest uppercase">Loading squad…</p>
            </div>
          ) : (
            POSITION_SECTIONS.map(({ pos, label }) => {
              const players = squad.players
                .filter((p) => p.position === pos)
                .sort((a, b) => a.number - b.number);
              if (!players.length) return null;
              return (
                <div key={pos}>
                  {/* Section header */}
                  <div className="bg-gray-50 border-b border-gray-100 px-5 py-2 sticky top-0">
                    <span className="font-inter font-black text-xs text-wc-black tracking-[0.2em] uppercase">
                      {label}
                    </span>
                  </div>

                  {/* Players */}
                  <div className="divide-y divide-gray-50">
                    {players.map((player) => {
                      const isLive = liveTeamNames.some((n) =>
                        (n ?? '').toLowerCase().includes((team.name ?? '').toLowerCase().slice(0, 5))
                      );
                      return (
                        <div
                          key={player.number}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                        >
                          {/* Jersey number */}
                          <span
                            className="font-inter font-black text-sm w-7 h-7 flex items-center justify-center flex-shrink-0 text-white"
                            style={{ backgroundColor: team.headerHex }}
                          >
                            {player.number}
                          </span>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <span className="font-inter font-bold text-sm text-wc-black block truncate">
                              {player.name}
                            </span>
                            <span className="font-inter text-xs text-gray-400 truncate block">
                              {player.club}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-center hidden sm:block">
                              <p className="font-inter font-bold text-xs text-wc-black">{player.age}</p>
                              <p className="font-inter text-gray-400" style={{ fontSize: '10px' }}>AGE</p>
                            </div>
                            <div className="text-center">
                              <p className="font-inter font-bold text-xs text-wc-black">{player.caps}</p>
                              <p className="font-inter text-gray-400" style={{ fontSize: '10px' }}>CAPS</p>
                            </div>
                            {isLive && (
                              <span className="inline-flex items-center gap-1 bg-wc-red px-2 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <span className="font-anton text-white text-xs leading-none">LIVE</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t-2 border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="font-inter text-xs text-gray-400 text-center">
            {squad.players.length} players · WC 2026 squad
            {source === 'wikipedia' ? ' · Source: Wikipedia' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
