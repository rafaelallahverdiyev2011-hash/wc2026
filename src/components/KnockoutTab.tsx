import { useState, useCallback, useEffect } from 'react';
import { KNOCKOUT_FIXTURES } from './ScheduleTab';
import {
  fetchAllMatches,
  FDMatch,
  isLiveStatus,
  isFinishedStatus,
  normaliseStage,
} from '../services/footballData';
import { useInterval } from '../hooks/useInterval';

// ── Layout ───────────────────────────────────────────────────────────────────────
// Each match occupies 2 team cards (CARD_H each). The "center" of a match
// is the seam between the two cards → used as the connector Y coordinate.
const CARD_H  = 24;   // height of one team card
const SLOT_H  = 56;   // vertical space per R32 match (gap = 56 - 48 = 8px)
const TOTAL_H = 8 * SLOT_H; // 448px
const CONN_W  = 18;   // connector SVG width (fixed)

// Center Y of each match group (= top of away card = bottom of home card)
const L32_CTR = [0,1,2,3,4,5,6,7].map(i => i * SLOT_H + SLOT_H / 2);
// [28, 84, 140, 196, 252, 308, 364, 420]
const L16_CTR = [0,1,2,3].map(i => (L32_CTR[i*2] + L32_CTR[i*2+1]) / 2);
// [56, 168, 280, 392]
const LQF_CTR = [0,1].map(i => (L16_CTR[i*2] + L16_CTR[i*2+1]) / 2);
// [112, 336]
const LSF_CTR = (LQF_CTR[0] + LQF_CTR[1]) / 2; // 224

const ROUND_HEX = {
  r32:   '#E3000B',
  r16:   '#6B2D8B',
  qf:    '#0057A8',
  sf:    '#00A850',
  final: '#C8D400',
};

// ── Team meta ────────────────────────────────────────────────────────────────────
const TEAM_META: Record<string, { code: string; flag: string }> = {
  'Mexico':               { code:'MEX', flag:'🇲🇽' }, 'South Africa':         { code:'RSA', flag:'🇿🇦' },
  'South Korea':          { code:'KOR', flag:'🇰🇷' }, 'Czechia':              { code:'CZE', flag:'🇨🇿' },
  'Canada':               { code:'CAN', flag:'🇨🇦' }, 'Bosnia & Herzegovina': { code:'BIH', flag:'🇧🇦' },
  'Qatar':                { code:'QAT', flag:'🇶🇦' }, 'Switzerland':          { code:'SUI', flag:'🇨🇭' },
  'Brazil':               { code:'BRA', flag:'🇧🇷' }, 'Morocco':              { code:'MAR', flag:'🇲🇦' },
  'Scotland':             { code:'SCO', flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿' }, 'Haiti':                { code:'HAI', flag:'🇭🇹' },
  'USA':                  { code:'USA', flag:'🇺🇸' }, 'Paraguay':             { code:'PAR', flag:'🇵🇾' },
  'Australia':            { code:'AUS', flag:'🇦🇺' }, 'Turkey':               { code:'TUR', flag:'🇹🇷' },
  'Germany':              { code:'GER', flag:'🇩🇪' }, 'Curaçao':              { code:'CUW', flag:'🇨🇼' },
  'Ivory Coast':          { code:'CIV', flag:'🇨🇮' }, 'Ecuador':              { code:'ECU', flag:'🇪🇨' },
  'Netherlands':          { code:'NED', flag:'🇳🇱' }, 'Japan':                { code:'JPN', flag:'🇯🇵' },
  'Sweden':               { code:'SWE', flag:'🇸🇪' }, 'Tunisia':              { code:'TUN', flag:'🇹🇳' },
  'Belgium':              { code:'BEL', flag:'🇧🇪' }, 'Egypt':                { code:'EGY', flag:'🇪🇬' },
  'Iran':                 { code:'IRN', flag:'🇮🇷' }, 'New Zealand':          { code:'NZL', flag:'🇳🇿' },
  'Spain':                { code:'ESP', flag:'🇪🇸' }, 'Cape Verde':           { code:'CPV', flag:'🇨🇻' },
  'Saudi Arabia':         { code:'KSA', flag:'🇸🇦' }, 'Uruguay':              { code:'URU', flag:'🇺🇾' },
  'France':               { code:'FRA', flag:'🇫🇷' }, 'Senegal':              { code:'SEN', flag:'🇸🇳' },
  'Iraq':                 { code:'IRQ', flag:'🇮🇶' }, 'Norway':               { code:'NOR', flag:'🇳🇴' },
  'Argentina':            { code:'ARG', flag:'🇦🇷' }, 'Algeria':              { code:'ALG', flag:'🇩🇿' },
  'Austria':              { code:'AUT', flag:'🇦🇹' }, 'Jordan':               { code:'JOR', flag:'🇯🇴' },
  'Portugal':             { code:'POR', flag:'🇵🇹' }, 'DR Congo':             { code:'COD', flag:'🇨🇩' },
  'Uzbekistan':           { code:'UZB', flag:'🇺🇿' }, 'Colombia':             { code:'COL', flag:'🇨🇴' },
  'Croatia':              { code:'CRO', flag:'🇭🇷' }, 'England':              { code:'ENG', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'Ghana':                { code:'GHA', flag:'🇬🇭' }, 'Panama':               { code:'PAN', flag:'🇵🇦' },
};

function teamMeta(name: string | null | undefined): { code: string; flag: string } {
  if (!name) return { code: 'TBD', flag: '🏳' };
  if (TEAM_META[name]) return TEAM_META[name];
  const nl = name.toLowerCase().replace(/[^a-z]/g, '');
  const entry = Object.entries(TEAM_META).find(([k]) => {
    const kl = k.toLowerCase().replace(/[^a-z]/g, '');
    return nl.includes(kl.slice(0, 5)) || kl.includes(nl.slice(0, 5));
  });
  return entry ? entry[1] : { code: name.slice(0, 3).toUpperCase(), flag: '🏳' };
}

// ── Win probability ──────────────────────────────────────────────────────────────
const FIFA_RANK: Record<string, number> = {
  Argentina:1, France:2, Spain:3, England:4, Brazil:5,
  Portugal:6, Netherlands:7, Belgium:8, Germany:9,
  Morocco:12, USA:13, Mexico:15, Colombia:16, Uruguay:17,
  Japan:18, Croatia:19, Senegal:20, Switzerland:22, 'South Korea':23,
  Turkey:28, Australia:30, Norway:32, Algeria:35, Ecuador:36,
  Sweden:37, Qatar:37, Iran:38, Egypt:39, Tunisia:42,
  'Ivory Coast':43, Ghana:45, Paraguay:46, 'Saudi Arabia':55,
  'South Africa':66, 'New Zealand':96,
  Austria:25, Scotland:40, Czechia:34, Canada:48,
  'Bosnia & Herzegovina':60, Haiti:88, 'Curaçao':110,
  Iraq:66, 'DR Congo':65, Uzbekistan:73, Panama:74,
  'Cape Verde':80, Jordan:81,
};

function calcProbs(home: string, away: string): [number, number] {
  const rH = FIFA_RANK[home] ?? 80;
  const rA = FIFA_RANK[away] ?? 80;
  const s = rA / (rH + rA);
  const imbalance = Math.abs(s - 0.5) * 2;
  const d = Math.max(10, Math.round(26 - imbalance * 14));
  const remaining = 100 - d;
  const h = Math.max(12, Math.min(remaining - 12, Math.round(s * remaining)));
  const a = 100 - h - d;
  const tot = h + a;
  return [Math.round(h / tot * 100), Math.round(a / tot * 100)];
}

function fuzzy(a: string | null | undefined, b: string | null | undefined): boolean {
  const al = (a ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const bl = (b ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (!al || !bl) return false;
  return al.includes(bl.slice(0, 5)) || bl.includes(al.slice(0, 5));
}

// ── Connector SVG ────────────────────────────────────────────────────────────────
// Connects pairs of match centers (y1, y2) on one side to a single target (to) on the other.
// "left" side: source on left edge → target on right edge
// "right" side: source on right edge → target on left edge
interface ConnPair { y1: number; y2: number; to: number }

function Connector({ pairs, side }: { pairs: ConnPair[]; side: 'left' | 'right' }) {
  const mid = CONN_W / 2;
  const d = pairs.map(({ y1, y2, to }) =>
    side === 'left'
      ? `M 0 ${y1} H ${mid} V ${y2} M 0 ${y2} H ${mid} M ${mid} ${to} H ${CONN_W}`
      : `M ${CONN_W} ${y1} H ${mid} V ${y2} M ${CONN_W} ${y2} H ${mid} M ${mid} ${to} H 0`
  ).join(' ');
  return (
    <svg width={CONN_W} height={TOTAL_H} style={{ flex: `0 0 ${CONN_W}px`, display: 'block', alignSelf: 'flex-start' }}>
      <path d={d} fill="none" stroke="#3a3a3a" strokeWidth={1.5} strokeLinecap="square" />
    </svg>
  );
}

function SingleConn({ side }: { side: 'left' | 'right' }) {
  const d = side === 'left'
    ? `M 0 ${LSF_CTR} H ${CONN_W}`
    : `M ${CONN_W} ${LSF_CTR} H 0`;
  return (
    <svg width={CONN_W} height={TOTAL_H} style={{ flex: `0 0 ${CONN_W}px`, display: 'block', alignSelf: 'flex-start' }}>
      <path d={d} fill="none" stroke="#3a3a3a" strokeWidth={1.5} strokeLinecap="square" />
    </svg>
  );
}

// ── Team card (one row, 24px) ─────────────────────────────────────────────────────
interface TeamCardProps {
  name: string | null;
  flag: string;
  code: string;
  score: number | null;
  prob: number;
  isFav: boolean;
  isWinner: boolean;
  isLoser: boolean;
  showLiveDot: boolean;
  minute: number | null;
  accentHex: string;
}

function TeamCard({ name, flag, code, score, prob, isFav, isWinner, isLoser, showLiveDot, minute, accentHex }: TeamCardProps) {
  return (
    <div style={{
      height: CARD_H,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 4px',
      backgroundColor: isWinner ? `${accentHex}22` : '#111',
      opacity: isLoser ? 0.38 : 1,
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
        {name ? (
          <>
            <span style={{ fontSize: 8, lineHeight: 1, flexShrink: 0 }}>{flag}</span>
            <span style={{
              color: isWinner ? '#fff' : '#ccc',
              fontSize: 9, fontWeight: isWinner ? 900 : 700,
              letterSpacing: '0.02em', textTransform: 'uppercase',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{code}</span>
            {showLiveDot && (
              <span style={{ fontSize: 6, color: '#E3000B', fontWeight: 700, flexShrink: 0 }}>
                {minute != null ? `${minute}'` : '●'}
              </span>
            )}
          </>
        ) : (
          <span style={{ color: '#2a2a2a', fontSize: 8, fontWeight: 700 }}>TBD</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {score !== null && (
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 900 }}>{score}</span>
        )}
        {score === null && name && (
          <span style={{ fontSize: 7, color: isFav ? '#00A850' : '#333', fontWeight: 700, minWidth: 16, textAlign: 'right' }}>
            {prob}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Match group (2 team cards for one match, absolutely positioned) ──────────────
interface MatchGroupProps {
  match: FDMatch | null;
  centerY: number;   // Y position of the seam between the two team cards
  liveList: FDMatch[];
  accentHex: string;
  isFinal?: boolean;
}

function MatchGroup({ match, centerY, liveList, accentHex, isFinal = false }: MatchGroupProps) {
  const top = centerY - CARD_H; // home card starts here

  const hName = match?.homeTeam?.name ?? null;
  const aName = match?.awayTeam?.name ?? null;
  const hMeta = teamMeta(hName);
  const aMeta = teamMeta(aName);

  const live = hName && aName
    ? liveList.find(lm => fuzzy(hName, lm.homeTeam.name) && fuzzy(aName, lm.awayTeam.name)) ?? null
    : null;
  const isLive     = !!live || isLiveStatus(match?.status ?? '');
  const isFinished = !isLive && isFinishedStatus(match?.status ?? '');

  const hScore = live?.score.fullTime.home ?? match?.score.fullTime.home ?? null;
  const aScore = live?.score.fullTime.away ?? match?.score.fullTime.away ?? null;
  const hasScore = hScore !== null && aScore !== null;
  const minute   = live?.minute ?? match?.minute ?? null;

  const homeWon = isFinished && hasScore && (hScore ?? 0) > (aScore ?? 0);
  const awayWon = isFinished && hasScore && (aScore ?? 0) > (hScore ?? 0);

  const [hProb, aProb] = hName && aName ? calcProbs(hName, aName) : [50, 50];

  const borderColor = isFinal ? '#FFD700' : accentHex + '55';
  const borderWidth = isFinal ? 2 : 1;

  return (
    <div style={{
      position: 'absolute',
      top,
      left: 0,
      right: 0,
      outline: `${borderWidth}px solid ${borderColor}`,
      outlineOffset: '-1px',
      boxShadow: isFinal ? '0 0 14px rgba(255,215,0,0.18)' : 'none',
    }}>
      {isLive && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: '#E3000B', zIndex: 2 }} />
      )}
      <TeamCard
        name={hName} flag={hMeta.flag} code={hMeta.code}
        score={hasScore ? hScore : null}
        prob={hProb} isFav={hProb >= aProb}
        isWinner={homeWon} isLoser={awayWon}
        showLiveDot={isLive} minute={minute}
        accentHex={accentHex}
      />
      <div style={{ height: 1, backgroundColor: '#1e1e1e' }} />
      <TeamCard
        name={aName} flag={aMeta.flag} code={aMeta.code}
        score={hasScore ? aScore : null}
        prob={aProb} isFav={aProb > hProb}
        isWinner={awayWon} isLoser={homeWon}
        showLiveDot={false} minute={null}
        accentHex={accentHex}
      />
    </div>
  );
}

// ── Round column (flex: 1) ───────────────────────────────────────────────────────
interface RoundColProps {
  matches: (FDMatch | null)[];
  centers: number[];
  liveList: FDMatch[];
  accentHex: string;
  isFinal?: boolean;
  showTrophy?: boolean;
}

function RoundColumn({ matches, centers, liveList, accentHex, isFinal = false, showTrophy = false }: RoundColProps) {
  return (
    <div style={{ flex: 1, position: 'relative', height: TOTAL_H, minWidth: 0 }}>
      {showTrophy && (
        <div style={{
          position: 'absolute',
          top: (centers[0] ?? LSF_CTR) - CARD_H - 18,
          left: 0, right: 0, textAlign: 'center', fontSize: 12,
        }}>
          🏆
        </div>
      )}
      {matches.map((m, i) => (
        <MatchGroup
          key={i}
          match={m}
          centerY={centers[i] ?? 0}
          liveList={liveList}
          accentHex={accentHex}
          isFinal={isFinal}
        />
      ))}
    </div>
  );
}

// ── Round header label (flex: 1 to match column) ─────────────────────────────────
function RoundLabel({ label, hex }: { label: string; hex: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, marginBottom: 4 }}>
      <div style={{ backgroundColor: hex, padding: '3px 2px', textAlign: 'center', overflow: 'hidden' }}>
        <span style={{
          color: '#fff', fontSize: 7, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </div>
    </div>
  );
}

const ConnGap = () => <div style={{ flex: `0 0 ${CONN_W}px`, flexShrink: 0 }} />;

// ── Main ─────────────────────────────────────────────────────────────────────────
interface Props { liveMatches: FDMatch[] }

export default function KnockoutTab({ liveMatches }: Props) {
  const [allMatches, setAllMatches] = useState<FDMatch[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllMatches();
      // Merge API data with static knockout fixtures
      const staticKnockout: FDMatch[] = KNOCKOUT_FIXTURES.filter((f: any) => f.home !== 'TBD' && f.away !== 'TBD').map((f: any) => ({
        id: f.matchNum,
        homeTeam: { id: 0, name: f.home, shortName: f.home, tla: f.home.substring(0,3).toUpperCase(), crest: '' },
        awayTeam: { id: 0, name: f.away, shortName: f.away, tla: f.away.substring(0,3).toUpperCase(), crest: '' },
        status: 'SCHEDULED' as const,
        stage: f.stage,
        matchday: null,
        utcDate: f.date + 'T00:00:00Z',
        minute: null,
        score: { winner: null, duration: 'REGULAR' as const, fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
        goals: [],
      }));
      const apiKnockoutNums = new Set(data.filter((m: FDMatch) => {
        const s = typeof m.stage === 'string' ? m.stage.toLowerCase() : '';
        return s.includes('32') || s.includes('16') || s.includes('quarter') || s.includes('semi') || s.includes('final');
      }).map((m: FDMatch) => m.id));
      const merged = [...data, ...staticKnockout.filter((s: FDMatch) => !apiKnockoutNums.has(s.id))];
      console.log('[KNOCKOUT] merged total:', merged.length);
      console.log('[KNOCKOUT] r32 matches:', merged.filter((m: FDMatch) => normaliseStage(m.stage) === 'Round of 32').map((m: FDMatch) => m.homeTeam.name + ' vs ' + m.awayTeam.name));
      setAllMatches(merged);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useInterval(load, 60_000);

  const pad = (arr: FDMatch[], n: number): (FDMatch | null)[] =>
    [...arr, ...Array(Math.max(0, n - arr.length)).fill(null)].slice(0, n);

  const r32Pad = pad(allMatches.filter(m => normaliseStage(m.stage) === 'Round of 32'), 16);
  const r16Pad = pad(allMatches.filter(m => normaliseStage(m.stage) === 'Round of 16'), 8);
  const qfPad  = pad(allMatches.filter(m => normaliseStage(m.stage) === 'Quarterfinals'), 4);
  const sfPad  = pad(allMatches.filter(m => normaliseStage(m.stage) === 'Semifinals'), 2);
  const fin    = allMatches.find(m => normaliseStage(m.stage) === 'Final') ?? null;

  const leftR32  = r32Pad.slice(0, 8);
  const rightR32 = r32Pad.slice(8, 16);
  const leftR16  = r16Pad.slice(0, 4);
  const rightR16 = r16Pad.slice(4, 8);
  const leftQF   = qfPad.slice(0, 2);
  const rightQF  = qfPad.slice(2, 4);
  const leftSF   = sfPad.slice(0, 1);
  const rightSF  = sfPad.slice(1, 2);

  const hasData = r32Pad.some(m => m) || r16Pad.some(m => m) || fin !== null;

  // Connector pairs — same for both halves due to symmetric layout
  const r32ToR16: ConnPair[] = [0,1,2,3].map(i => ({
    y1: L32_CTR[i*2], y2: L32_CTR[i*2+1], to: L16_CTR[i],
  }));
  const r16ToQF: ConnPair[] = [0,1].map(i => ({
    y1: L16_CTR[i*2], y2: L16_CTR[i*2+1], to: LQF_CTR[i],
  }));
  const qfToSF: ConnPair[] = [{ y1: LQF_CTR[0], y2: LQF_CTR[1], to: LSF_CTR }];

  return (
    <div>
      {/* Heading */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 self-stretch" style={{ background: 'linear-gradient(180deg,#E3000B,#C8D400)', minHeight: 48 }} />
          <div>
            <h2 className="font-anton text-white uppercase tracking-wider" style={{ fontSize: 'clamp(28px,5vw,56px)' }}>
              KNOCKOUT BRACKET
            </h2>
            <p className="font-inter text-gray-600 text-xs font-semibold tracking-widest uppercase mt-1">
              R32 · R16 · Quarterfinals · Semifinals · Final · Jul 19, MetLife
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div style={{ width: 8, height: 8, backgroundColor: '#00A850' }} />
          <span className="font-inter text-xs font-bold tracking-widest uppercase" style={{ color: '#555' }}>
            Win %
          </span>
        </div>
      </div>

      {loading && !hasData && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-wc-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-anton text-gray-600 tracking-widest text-sm uppercase">Loading bracket…</p>
        </div>
      )}
      {error && !hasData && (
        <div className="p-8 text-center mb-8" style={{ border: '2px solid #E3000B' }}>
          <p className="font-anton text-wc-red text-lg tracking-widest mb-3 uppercase">{error}</p>
          <button onClick={load} className="bg-wc-red text-white font-anton px-6 py-2 tracking-widest uppercase hover:opacity-90 transition">
            Retry
          </button>
        </div>
      )}

      {/* Bracket */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <div style={{ minWidth: 480 }}>

          {/* Headers */}
          <div style={{ display: 'flex', width: '100%', alignItems: 'flex-end' }}>
            <RoundLabel label="Round of 32"   hex={ROUND_HEX.r32} />
            <ConnGap />
            <RoundLabel label="Round of 16"   hex={ROUND_HEX.r16} />
            <ConnGap />
            <RoundLabel label="Quarterfinals"  hex={ROUND_HEX.qf} />
            <ConnGap />
            <RoundLabel label="Semifinals"     hex={ROUND_HEX.sf} />
            <ConnGap />
            <RoundLabel label="🏆 Final"       hex={ROUND_HEX.final} />
            <ConnGap />
            <RoundLabel label="Semifinals"     hex={ROUND_HEX.sf} />
            <ConnGap />
            <RoundLabel label="Quarterfinals"  hex={ROUND_HEX.qf} />
            <ConnGap />
            <RoundLabel label="Round of 16"   hex={ROUND_HEX.r16} />
            <ConnGap />
            <RoundLabel label="Round of 32"   hex={ROUND_HEX.r32} />
          </div>

          {/* Bracket row */}
          <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
            {/* Left half */}
            <RoundColumn matches={leftR32}  centers={L32_CTR}   liveList={liveMatches} accentHex={ROUND_HEX.r32} />
            <Connector   pairs={r32ToR16}   side="left" />
            <RoundColumn matches={leftR16}  centers={L16_CTR}   liveList={liveMatches} accentHex={ROUND_HEX.r16} />
            <Connector   pairs={r16ToQF}    side="left" />
            <RoundColumn matches={leftQF}   centers={LQF_CTR}   liveList={liveMatches} accentHex={ROUND_HEX.qf} />
            <Connector   pairs={qfToSF}     side="left" />
            <RoundColumn matches={leftSF}   centers={[LSF_CTR]} liveList={liveMatches} accentHex={ROUND_HEX.sf} />
            <SingleConn  side="left" />

            {/* Final (center) */}
            <RoundColumn
              matches={[fin]}
              centers={[LSF_CTR]}
              liveList={liveMatches}
              accentHex={ROUND_HEX.final}
              isFinal
              showTrophy
            />

            {/* Right half */}
            <SingleConn  side="right" />
            <RoundColumn matches={rightSF}  centers={[LSF_CTR]} liveList={liveMatches} accentHex={ROUND_HEX.sf} />
            <Connector   pairs={qfToSF}     side="right" />
            <RoundColumn matches={rightQF}  centers={LQF_CTR}   liveList={liveMatches} accentHex={ROUND_HEX.qf} />
            <Connector   pairs={r16ToQF}    side="right" />
            <RoundColumn matches={rightR16} centers={L16_CTR}   liveList={liveMatches} accentHex={ROUND_HEX.r16} />
            <Connector   pairs={r32ToR16}   side="right" />
            <RoundColumn matches={rightR32} centers={L32_CTR}   liveList={liveMatches} accentHex={ROUND_HEX.r32} />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {([
              { label: 'R32',          hex: ROUND_HEX.r32   },
              { label: 'R16',          hex: ROUND_HEX.r16   },
              { label: 'Quarterfinals',hex: ROUND_HEX.qf    },
              { label: 'Semifinals',   hex: ROUND_HEX.sf    },
              { label: 'Final',        hex: ROUND_HEX.final },
            ] as { label: string; hex: string }[]).map(({ label, hex }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, backgroundColor: hex, flexShrink: 0 }} />
                <span style={{ color: '#555', fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
              <div style={{ width: 7, height: 7, backgroundColor: '#00A850', flexShrink: 0 }} />
              <span style={{ color: '#555', fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Favorite Win %</span>
            </div>
          </div>

        </div>
      </div>

      {!hasData && !loading && !error && (
        <div className="py-20 text-center" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="font-anton text-gray-600 text-2xl tracking-widest mb-3">KNOCKOUT STAGE PENDING</p>
          <p className="font-inter text-gray-600 text-sm">Bracket populates once the group stage concludes.</p>
        </div>
      )}
    </div>
  );
}
