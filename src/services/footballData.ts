// World Cup 2026 Live API (RapidAPI) — world-cup-2026-live-api.p.rapidapi.com
// Dev: Vite proxy /rapidapi/* → API host
// Prod: Supabase Edge Function at football-proxy

const HARDCODED_RESULTS: Record<string, { home: number; away: number }> = {
  "Mexico_South Africa": { home: 2, away: 0 },
  "South Africa_Mexico": { home: 0, away: 2 },
  "South Korea_Czechia": { home: 2, away: 1 },
  "Czechia_South Korea": { home: 1, away: 2 },
};

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export type MatchStatus =
  | 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED'
  | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED' | 'AWARDED';

export interface FDScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: string;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
  minute?: number;
  goals?: GoalEvent[];
}

export interface FDStandingRow {
  position: number;
  team: FDTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
}

export interface FDStandingGroup {
  stage: string;
  type: string;
  group: string;
  table: FDStandingRow[];
}

// ── Match detail types ────────────────────────────────────────────────────────

export interface MatchStatItem {
  type: string;
  home: string | number | null;
  away: string | number | null;
}

export interface MatchPlayer {
  id: number;
  name: string;
  number: number | null;
  position: string | null;
}

export interface MatchLineup {
  homeTeam: string;
  awayTeam: string;
  homeFormation: string;
  awayFormation: string;
  homeStartXI: MatchPlayer[];
  awayStartXI: MatchPlayer[];
  homeSubs: MatchPlayer[];
  awaySubs: MatchPlayer[];
}

export interface GoalEvent {
  minute: string;
  scorer: string;
  team: 'home' | 'away';
  type: 'goal' | 'own-goal' | 'penalty';
}

export interface CommentaryEvent {
  minute: string;
  type: string;
  text: string;
}

// ── localStorage cache ────────────────────────────────────────────────────────

const LS_TTL_MS        =  60_000;  // 60 s   — standings / draw
const LIVE_TTL_MS      =  60_000;  // 60 s   — live endpoint
const DETAIL_TTL       = 120_000;  // 2 min  — match detail
const RATE_LIMIT_BACKOFF = 120_000; // 2 min  — wait after 429

interface LSEntry<T> { data: T; ts: number }

function lsGet<T>(key: string, ttl = LS_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: LSEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts < ttl) return entry.data;
    localStorage.removeItem(key);
    return null;
  } catch { return null; }
}

function lsGetStale<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return (JSON.parse(raw) as LSEntry<T>).data;
  } catch { return null; }
}

function lsSet<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* quota */ }
}

function lsTs(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return (JSON.parse(raw) as LSEntry<unknown>).ts ?? null;
  } catch { return null; }
}

export function cacheAge(key: string): number | null {
  const ts = lsTs(key);
  return ts === null ? null : Date.now() - ts;
}

// ── Rate-limit guard ──────────────────────────────────────────────────────────

let lastFetchAttempt = 0;
let rateLimitedUntil = 0; // timestamp: don't retry before this

export function canRetryNow(): boolean {
  return Date.now() - lastFetchAttempt >= 60_000 && Date.now() >= rateLimitedUntil;
}

export function msUntilRetry(): number {
  const sinceAttempt = Math.max(0, 60_000 - (Date.now() - lastFetchAttempt));
  const untilRateLimit = Math.max(0, rateLimitedUntil - Date.now());
  return Math.max(sinceAttempt, untilRateLimit);
}

// ── HTTP fetch ────────────────────────────────────────────────────────────────

const RAPIDAPI_HOST = 'world-cup-2026-live-api.p.rapidapi.com';

function getApiUrl(path: string): string {
  return `https://${RAPIDAPI_HOST}${path}`;
}

async function apiFetch<T>(path: string): Promise<T> {
  // Respect 2-minute 429 backoff
  if (Date.now() < rateLimitedUntil) {
    const secs = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
    console.warn(`[WC API] Rate-limit backoff active — ${secs}s remaining, skipping ${path}`);
    throw Object.assign(new Error('rate_limited'), { status: 429 });
  }

  lastFetchAttempt = Date.now();
  const url = getApiUrl(path);
 console.log(`[WC API] GET https://${RAPIDAPI_HOST}${path}`);

 const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
  };
  const res = await fetch(url, { headers });

  // 429 rate-limit: back off 2 minutes, throw so caller serves stale cache
  if (res.status === 429) {
    rateLimitedUntil = Date.now() + RATE_LIMIT_BACKOFF;
    console.warn(`[WC API] 429 received for ${path} — backing off for 2 minutes until ${new Date(rateLimitedUntil).toLocaleTimeString()}`);
    throw Object.assign(new Error('rate_limited'), { status: 429 });
  }

  if (!res.ok) throw new Error(`API error ${res.status}`);
  const text = await res.text();
  try {
    const parsed = JSON.parse(text) as T;
    console.log(`[WC API] FULL RESPONSE for ${path}:`, JSON.stringify(parsed, null, 2));
    return parsed;
  } catch {
    console.log(`[WC API] RAW TEXT for ${path}:`, text);
    throw new Error('Invalid JSON from API');
  }
}

// ── Normalise raw API responses → FDMatch ─────────────────────────────────────

interface RawTeam {
  id?: number; name?: string; shortName?: string; code?: string; flag?: string;
}

interface RawMatch {
  id?: number; matchId?: string | number;
  date?: string; utcDate?: string; datetime?: string; kickoff?: string;
  status?: string | number;
  minute?: number | null; elapsed?: number | null;
  matchday?: number | null; stage?: string; group?: string | null;
  homeTeam?: RawTeam; home?: RawTeam | string;
  awayTeam?: RawTeam; away?: RawTeam | string;
  score?: { home?: number | null; away?: number | null; halftime?: { home?: number | null; away?: number | null } };
  goals?: { home?: number | null; away?: number | null };
  // RapidAPI draw endpoint fields
  scoreHome?: number | null;
  scoreAway?: number | null;
  round?: string;
  events?: unknown[];
  incidents?: unknown[];
  scorers?: unknown[];
}

function mapStatus(raw: string | number | undefined): MatchStatus {
  if (typeof raw === 'number') {
    // RapidAPI draw endpoint numeric status: 1=scheduled, 2=live, 3=finished
    if (raw === 0 || raw === 2) return 'IN_PLAY';
    if (raw === 3) return 'FINISHED';
    return 'SCHEDULED';
  }
  const s = (raw ?? '').toString().trim().toUpperCase();
  // Live / in-play
  if (s === '1H' || s === '2H' || s === 'ET' || s === 'P' || s === 'BT' || s === 'LIVE' || s === 'IN_PLAY') return 'IN_PLAY';
  if (s === 'HT') return 'PAUSED';
  // All finished variants the API might return
  if (
    s === 'FT' || s === 'AET' || s === 'PEN' ||
    s === 'FINISHED' || s === 'FULL_TIME' || s === 'FULLTIME' ||
    s === 'ENDED' || s === 'COMPLETE' || s === 'COMPLETED' ||
    s === 'RESULT' || s === '2' || s === '3'
  ) return 'FINISHED';
  if (s === 'CANC' || s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  if (s === 'SUSP' || s === 'SUSPENDED') return 'SUSPENDED';
  if (s === 'PST' || s === 'POSTPONED') return 'POSTPONED';
  return 'SCHEDULED';
}

function toTeam(raw: RawTeam | string | undefined, fallback: string): FDTeam {
  if (typeof raw === 'string') {
    const name = raw || fallback;
    return { id: 0, name, shortName: name, tla: name.slice(0, 3).toUpperCase(), crest: '' };
  }
  const name = raw?.name ?? fallback;
  return { id: raw?.id ?? 0, name, shortName: raw?.shortName ?? raw?.code ?? name,
    tla: (raw?.code ?? name).slice(0, 3).toUpperCase(), crest: raw?.flag ?? '' };
}

function parseGoalEvents(raw: RawMatch, homeId: number): GoalEvent[] {
  const evArr: unknown[] = raw.events ?? raw.incidents ?? raw.scorers ?? [];
  if (!evArr.length) return [];
  const result: GoalEvent[] = [];
  for (const e of evArr) {
    const ev = (e ?? {}) as Record<string, unknown>;
    const evType = String(ev.type ?? ev.event ?? ev.detail ?? ev.category ?? '').toLowerCase();
    if (!evType.includes('goal') && !evType.includes('penalty') && !evType.includes('score')) continue;
    const teamId = Number((ev.team as Record<string, unknown>)?.id ?? ev.teamId ?? 0);
    const playerName = String(
      (ev.player as Record<string, unknown>)?.name ??
      ev.player ?? ev.scorer ?? ev.playerName ?? ev.name ?? ''
    );
    if (!playerName) continue;
    const isOwnGoal = evType.includes('own');
    const isPen = evType.includes('penalty') || evType.includes('pen');
    const side: 'home' | 'away' = teamId === homeId
      ? (isOwnGoal ? 'away' : 'home')
      : (isOwnGoal ? 'home' : 'away');
    result.push({
      minute: String(ev.minute ?? ev.time ?? ev.elapsed ?? ''),
      scorer: playerName,
      team: side,
      type: isOwnGoal ? 'own-goal' : isPen ? 'penalty' : 'goal',
    });
  }
  return result;
}

function toFDMatch(raw: RawMatch): FDMatch {
  console.log('RAW MATCH DEBUG:', JSON.stringify(raw, null, 2));
  const home  = toTeam(raw.homeTeam ?? raw.home, 'TBD');
  const away  = toTeam(raw.awayTeam ?? raw.away, 'TBD');
  const status = mapStatus(raw.status);
  // Support scoreHome/scoreAway (draw endpoint) and score.home/goals.home (other endpoints)
  const hs   = raw.scoreHome ?? raw.score?.home ?? raw.goals?.home ?? null;
  const as_  = raw.scoreAway ?? raw.score?.away ?? raw.goals?.away ?? null;
  const hht  = raw.score?.halftime?.home ?? null;
  const aht  = raw.score?.halftime?.away ?? null;
  const min  = raw.minute ?? raw.elapsed;
  const finalStatus = (status === 'SCHEDULED' && hs !== null && as_ !== null && hs >= 0 && as_ >= 0)
    ? 'FINISHED' as MatchStatus
    : status;
  let winner: FDScore['winner'] = null;
  if (finalStatus === 'FINISHED' && hs !== null && as_ !== null)
    winner = hs > as_ ? 'HOME_TEAM' : as_ > hs ? 'AWAY_TEAM' : 'DRAW';
  const goals = parseGoalEvents(raw, home.id);
  // matchId can be a string (RapidAPI) — hash it to a number for internal id
  const rawId = raw.id ?? raw.matchId;
  const numId = typeof rawId === 'number' ? rawId
    : typeof rawId === 'string' ? (rawId.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) >>> 0)
    : 0;
  return {
    id: numId,
    utcDate: raw.utcDate ?? raw.date ?? raw.datetime ?? raw.kickoff ?? '',
    status: finalStatus, matchday: raw.matchday ?? null,
    stage: raw.stage ?? raw.round ?? '', group: raw.group ?? null,
    homeTeam: home, awayTeam: away,
    score: { winner, duration: 'REGULAR',
      fullTime: { home: hs, away: as_ },
      halfTime: { home: hht, away: aht } },
    minute: typeof min === 'number' ? min : undefined,
    goals: goals.length > 0 ? goals : undefined,
  };
}

function parseMatchList(data: unknown): FDMatch[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const list: unknown[] =
    Array.isArray(d.matches)  ? d.matches  :
    Array.isArray(d.data)     ? d.data     :
    Array.isArray(d.response) ? d.response :
    Array.isArray(data)       ? (data as unknown[]) : [];
  return list.map((m) => toFDMatch(m as RawMatch));
}

// ── Standings parser ──────────────────────────────────────────────────────────

function parseStandingRow(raw: unknown, idx: number): FDStandingRow {
  if (!raw || typeof raw !== 'object') {
    return { position: idx + 1, team: { id: 0, name: '?', shortName: '?', tla: '???', crest: '' },
      playedGames: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: null };
  }
  const r = raw as Record<string, unknown>;
  const t = (r.team ?? r) as Record<string, unknown>;
  const all = (r.all ?? r) as Record<string, unknown>;
  const goalsObj = (all.goals ?? {}) as Record<string, unknown>;
  const name = String(t.name ?? r.teamName ?? r.name ?? '?');
  const code = String(t.code ?? t.tla ?? name).slice(0, 3).toUpperCase();

  // Handle "goals" as "GF:GA" string (RapidAPI) or as object { for, against }
  let goalsFor = 0, goalsAgainst = 0;
  const goalsStr = r.goals;
  if (typeof goalsStr === 'string' && goalsStr.includes(':')) {
    const parts = goalsStr.split(':').map(Number);
    goalsFor = isNaN(parts[0]) ? 0 : parts[0];
    goalsAgainst = isNaN(parts[1]) ? 0 : parts[1];
  } else {
    goalsFor = Number(goalsObj.for ?? r.goalsFor ?? r.gf ?? 0);
    goalsAgainst = Number(goalsObj.against ?? r.goalsAgainst ?? r.ga ?? 0);
  }

  return {
    position: Number(r.position ?? r.rank ?? idx + 1),
    team: { id: Number(t.id ?? r.teamId ?? 0), name, shortName: String(t.shortName ?? code), tla: code, crest: '' },
    playedGames: Number(all.played ?? r.played ?? r.matchesPlayed ?? 0),
    won:  Number(all.win  ?? r.won  ?? r.wins  ?? 0),
    draw: Number(all.draw ?? r.drawn ?? r.draws ?? 0),
    lost: Number(all.lose ?? r.lost ?? r.losses ?? 0),
    goalsFor,
    goalsAgainst,
    goalDifference: Number(r.goalsDiff ?? r.gd ?? (goalsFor - goalsAgainst)),
    points: Number(r.points ?? r.pts ?? 0),
    form: null,
  };
}

function parseStandingsResponse(data: unknown): FDStandingGroup[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;

  // Shape: { standings: [ { group: "A", table: [...] } ] }
  const arr =
    Array.isArray(d.standings) ? d.standings :
    Array.isArray(d.data)      ? d.data      :
    Array.isArray(d.groups)    ? d.groups    : null;

  if (arr) {
    const result: FDStandingGroup[] = [];
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const g = item as Record<string, unknown>;
      const letter = String(g.group ?? g.name ?? g.letter ?? '')
        .replace(/^group\s*/i, '').replace(/^GROUP_?/i, '').replace(/^GRP_?/i, '').trim();
      const rows: unknown[] = Array.isArray(g.table) ? g.table : Array.isArray(g.teams) ? g.teams : Array.isArray(g.standings) ? g.standings : [];
      if (!letter) continue;
      result.push({ stage: 'GROUP_STAGE', type: 'TOTAL', group: `GROUP_${letter}`,
        table: rows.map((r, i) => parseStandingRow(r, i)) });
    }
    if (result.length > 0) return result;
  }

  // Shape: { A: [...], B: [...] } (keyed by letter)
  const grouped = d.data ?? d.groups ?? d.standings;
  if (grouped && typeof grouped === 'object' && !Array.isArray(grouped)) {
    const result: FDStandingGroup[] = [];
    for (const [letter, rows] of Object.entries(grouped as Record<string, unknown>)) {
      if (!Array.isArray(rows)) continue;
      result.push({ stage: 'GROUP_STAGE', type: 'TOTAL', group: `GROUP_${letter}`,
        table: rows.map((r, i) => parseStandingRow(r, i)) });
    }
    if (result.length > 0) return result;
  }
  return [];
}

// ── Draw parser ───────────────────────────────────────────────────────────────

export interface DrawTeam { id: number; name: string; flag: string }
export type GroupDraw = Record<string, DrawTeam[]>;

function parseDrawResponse(data: unknown): GroupDraw {
  if (!data || typeof data !== 'object') return {};
  const d = data as Record<string, unknown>;
  const result: GroupDraw = {};

  const arr =
    Array.isArray(d.draw)   ? d.draw   :
    Array.isArray(d.groups) ? d.groups :
    Array.isArray(d.data)   ? d.data   : null;

  if (arr) {
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const g = item as Record<string, unknown>;
      const letter = String(g.group ?? g.name ?? g.letter ?? '').replace(/^GROUP_?/i, '').toUpperCase();
      const teams: unknown[] = Array.isArray(g.teams) ? g.teams : Array.isArray(g.countries) ? g.countries : [];
      if (!letter) continue;
      result[letter] = teams.map((t: unknown) => {
        const tm = (t ?? {}) as Record<string, unknown>;
        return { id: Number(tm.id ?? 0), name: String(tm.name ?? ''), flag: String(tm.flag ?? tm.logo ?? '') };
      });
    }
    return result;
  }

  // Keyed by letter: { A: [{...},...], B: [...] }
  const keyed = d.draw ?? d.groups ?? d.data;
  if (keyed && typeof keyed === 'object' && !Array.isArray(keyed)) {
    for (const [letter, teams] of Object.entries(keyed as Record<string, unknown>)) {
      if (!Array.isArray(teams)) continue;
      result[letter] = teams.map((t: unknown) => {
        const tm = (t ?? {}) as Record<string, unknown>;
        return { id: Number(tm.id ?? 0), name: String(tm.name ?? ''), flag: String(tm.flag ?? '') };
      });
    }
  }
  return result;
}

// ── Match detail parsers ──────────────────────────────────────────────────────

function parseStatsResponse(data: unknown): MatchStatItem[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const sections: unknown[] = Array.isArray(d.data) ? d.data : [];
  const result: MatchStatItem[] = [];
  for (const section of sections) {
    const s = section as Record<string, unknown>;
    const groups: unknown[] = Array.isArray(s.groups) ? s.groups : [];
    for (const group of groups) {
      const g = group as Record<string, unknown>;
      const stats: unknown[] = Array.isArray(g.stats) ? g.stats : [];
      for (const stat of stats) {
        const st = stat as Record<string, unknown>;
        result.push({
          type: String(st.name ?? ''),
          home: st.home ?? null,
          away: st.away ?? null,
        });
      }
    }
  }
  return result;
}

function parseLineupResponse(data: unknown): MatchLineup {
  const empty: MatchLineup = {
    homeTeam: '', awayTeam: '', homeFormation: '', awayFormation: '',
    homeStartXI: [], awayStartXI: [], homeSubs: [], awaySubs: [],
  };
  if (!data || typeof data !== 'object') return empty;
  const d = data as Record<string, unknown>;
  const inner = (d.data ?? d) as Record<string, unknown>;

  function parsePlayers(players: unknown[]): MatchPlayer[] {
    return players.map((p: unknown) => {
      const pl = (p ?? {}) as Record<string, unknown>;
      return {
        id: 0,
        name: String(pl.name ?? pl.shortName ?? ''),
        number: pl.number != null ? Number(pl.number) : null,
        position: String(pl.role ?? pl.position ?? '') || null,
      };
    });
  }

  const startXI = (inner.startingXI ?? {}) as Record<string, unknown>;
  const subs = (inner.substitutes ?? {}) as Record<string, unknown>;
  const formation = (inner.formation ?? {}) as Record<string, unknown>;

  if (startXI.home || startXI.away) {
    return {
      homeTeam: '',
      awayTeam: '',
      homeFormation: String(formation.home ?? ''),
      awayFormation: String(formation.away ?? ''),
      homeStartXI: parsePlayers(Array.isArray(startXI.home) ? startXI.home : []),
      awayStartXI: parsePlayers(Array.isArray(startXI.away) ? startXI.away : []),
      homeSubs: parsePlayers(Array.isArray(subs.home) ? subs.home : []),
      awaySubs: parsePlayers(Array.isArray(subs.away) ? subs.away : []),
    };
  }

  const arr =
    Array.isArray(d.lineups) ? d.lineups :
    Array.isArray(d.data)    ? d.data    : null;
  if (!arr || arr.length < 2) return empty;
  const h = arr[0] as Record<string, unknown>;
  const a = arr[1] as Record<string, unknown>;
  const hTeam = (h.team ?? {}) as Record<string, unknown>;
  const aTeam = (a.team ?? {}) as Record<string, unknown>;
  return {
    homeTeam: String(hTeam.name ?? ''),
    awayTeam: String(aTeam.name ?? ''),
    homeFormation: String(h.formation ?? ''),
    awayFormation: String(a.formation ?? ''),
    homeStartXI: parsePlayers(Array.isArray(h.startXI) ? h.startXI : []),
    awayStartXI: parsePlayers(Array.isArray(a.startXI) ? a.startXI : []),
    homeSubs: parsePlayers(Array.isArray(h.substitutes) ? h.substitutes : []),
    awaySubs: parsePlayers(Array.isArray(a.substitutes) ? a.substitutes : []),
  };
}

function parseCommentaryResponse(data: unknown): CommentaryEvent[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const inner = (d.data ?? d) as Record<string, unknown>;
  const incidents = Array.isArray(inner.incidents) ? inner.incidents : [];
  if (incidents.length > 0) {
    return incidents.map((e: unknown) => {
      const ev = (e ?? {}) as Record<string, unknown>;
      return {
        minute: String(ev.minute ?? ''),
        type:   String(ev.type ?? '').toLowerCase(),
        text:   String(ev.text ?? ev.player ?? ''),
      };
    }).filter((e: CommentaryEvent) => e.minute || e.text);
  }
  const arr =
    Array.isArray(d.commentary) ? d.commentary :
    Array.isArray(d.events)     ? d.events     :
    Array.isArray(d.data)       ? d.data       :
    Array.isArray(data)         ? (data as unknown[]) : [];
  return arr.map((e: unknown) => {
    const ev = (e ?? {}) as Record<string, unknown>;
    return {
      minute: String(ev.minute ?? ev.time ?? ev.min ?? ''),
      type:   String(ev.type ?? ev.event ?? ev.category ?? '').toLowerCase(),
      text:   String(ev.text ?? ev.comment ?? ev.description ?? ev.detail ?? ''),
    };
  }).filter(e => e.text || e.minute);
}

// ── Fallback standings ────────────────────────────────────────────────────────

const FALLBACK_GROUPS: Record<string, string[]> = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Turkey'],
  E: ['Germany', 'Curacao', "Côte d'Ivoire", 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

function buildFallbackStandings(): FDStandingGroup[] {
  return Object.entries(FALLBACK_GROUPS).map(([letter, teams]) => ({
    stage: 'GROUP_STAGE', type: 'TOTAL', group: `GROUP_${letter}`,
    table: teams.map((name, i) => ({
      position: i + 1,
      team: { id: 0, name, shortName: name, tla: name.slice(0, 3).toUpperCase(), crest: '' },
      playedGames: 0, won: 0, draw: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: null,
    })),
  }));
}

// ── matchId string → numeric id mapping (for detail fetches) ─────────────────

const matchIdMap = new Map<number, string>(); // numeric hash → original string matchId

export function getStringMatchId(numericId: number): string | null {
  if (matchIdMap.has(numericId)) return matchIdMap.get(numericId)!;
  try {
    const stored = JSON.parse(localStorage.getItem('wc_match_id_map') ?? '{}');
    const strId = stored[numericId] ?? null;
    if (strId) matchIdMap.set(numericId, strId);
    return strId;
  } catch { return null; }
}

// ── Draw + standings cross-reference ─────────────────────────────────────────

interface StandingTeamRaw {
  name: string;
  played: number;
  goals: string; // "2:0" format
  won: number;
  lost: number;
  drawn: number;
}

function buildGoalsLookup(standingsData: unknown): Map<string, StandingTeamRaw> {
  const map = new Map<string, StandingTeamRaw>();
  if (!standingsData || typeof standingsData !== 'object') return map;
  const d = standingsData as Record<string, unknown>;
  const groups: unknown[] = Array.isArray(d.data) ? d.data : [];
  for (const g of groups) {
    const group = g as Record<string, unknown>;
    const teams: unknown[] = Array.isArray(group.teams) ? group.teams : [];
    for (const t of teams) {
      const team = t as Record<string, unknown>;
      const name = String(team.name ?? '');
      if (name) {
        map.set(name.toLowerCase(), {
          name,
          played: Number(team.played ?? 0),
          goals: String(team.goals ?? '0:0'),
          won: Number(team.won ?? 0),
          lost: Number(team.lost ?? 0),
          drawn: Number(team.drawn ?? 0),
        });
      }
    }
  }
  return map;
}

function inferScore(homeName: string, awayName: string, lookup: Map<string, StandingTeamRaw>): { hs: number; as_: number } | null {
  const homeKey = homeName.toLowerCase();
  const awayKey = awayName.toLowerCase();
  // Try exact then prefix-fuzzy match
  let home = lookup.get(homeKey);
  let away = lookup.get(awayKey);
  if (!home) {
    for (const [k, v] of lookup) {
      if (k.startsWith(homeKey.slice(0, 6)) || homeKey.startsWith(k.slice(0, 6))) { home = v; break; }
    }
  }
  if (!away) {
    for (const [k, v] of lookup) {
      if (k.startsWith(awayKey.slice(0, 6)) || awayKey.startsWith(k.slice(0, 6))) { away = v; break; }
    }
  }
  if (!home || !away) return null;
  if (home.played === 0 || away.played === 0) return null;

  // Parse goals from "GF:GA" format
  const homeParts = home.goals.split(':').map(Number);
  const awayParts = away.goals.split(':').map(Number);
  const homeGF = homeParts[0], homeGA = homeParts[1];
  const awayGF = awayParts[0], awayGA = awayParts[1];
  if (isNaN(homeGF) || isNaN(homeGA) || isNaN(awayGF) || isNaN(awayGA)) return null;

  // Sanity check: reject only if both teams scored 0 goals total
  if (homeGF === 0 && awayGF === 0) return null;

  return { hs: homeGF, as_: awayGF };
}

function parseDrawMatches(drawData: unknown, standingsData: unknown): FDMatch[] {
  if (!drawData || typeof drawData !== 'object') return [];
  const d = drawData as Record<string, unknown>;
  const list: unknown[] = Array.isArray(d.data) ? d.data : [];
  const lookup = buildGoalsLookup(standingsData);

  console.log('[WC API] STANDINGS RAW DATA:', JSON.stringify(standingsData, null, 2));
  console.log(`[WC API] DRAW: ${list.length} match entries`);

  return list.map((item) => {
    const raw = item as RawMatch & { matchId?: string; home?: string; away?: string };

    // Log every raw match so we can see exact field names from the API
    console.log('[WC API] MATCH DATA:', JSON.stringify(raw, null, 2));

    const match = toFDMatch(raw);

    // Store string matchId in map for later detail fetches
    const strId = typeof raw.matchId === 'string' ? raw.matchId : null;
    if (strId) {
      matchIdMap.set(match.id, strId);
      // persist to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('wc_match_id_map') ?? '{}');
        stored[match.id] = strId;
        localStorage.setItem('wc_match_id_map', JSON.stringify(stored));
      } catch {}
    }


    console.log(`[WC API] MATCH STATUS: ${raw.home ?? ''} vs ${raw.away ?? ''} → raw.status=${JSON.stringify(raw.status)} → mapped=${match.status} score=${match.score.fullTime.home}:${match.score.fullTime.away}`);
    return match;
  });
}

// ── Startup prefetch ──────────────────────────────────────────────────────────

export async function prefetchAll(): Promise<void> {
  // no-op: /wc/matches does not exist; draw is fetched on demand
}

// ── Public API — all functions never throw ────────────────────────────────────

/** All WC matches from /wc/draw?stage=group, enriched with scores from standings. Cached 2 min. */
export async function fetchAllMatches(): Promise<FDMatch[]> {
  const hit = lsGet<FDMatch[]>('wc_draw_matches', LS_TTL_MS);
  if (hit) return hit;
  try {
    const [drawData, standingsData, knockoutData] = await Promise.all([
      apiFetch<unknown>('/wc/draw?stage=group'),
      apiFetch<unknown>('/wc/standings?stage=group'),
      apiFetch<unknown>('/wc/draw?stage=knockout').catch(() => null),
    ]);
    const groupMatches = parseDrawMatches(drawData, standingsData);
    const apiKnockout = knockoutData ? parseDrawMatches(knockoutData, {}) : [];
    const matches = [...groupMatches, ...apiKnockout];
    lsSet('wc_draw_matches', matches);
    return matches;
  } catch {
    return lsGetStale<FDMatch[]>('wc_draw_matches') ?? [];
  }
}

/** Currently live matches via /wc/live. Cached 60 s. */
export async function fetchLiveMatches(): Promise<FDMatch[]> {
  const hit = lsGet<FDMatch[]>('wc_live', LIVE_TTL_MS);
  if (hit) return hit;
  try {
    const data = await apiFetch<unknown>('/wc/live');
    const matches = parseMatchList(data);
    lsSet('wc_live', matches);
    return matches;
  } catch {
    return lsGetStale<FDMatch[]>('wc_live') ?? [];
  }
}

/** Group standings via /wc/standings?stage=group. Falls back to static. Cached 5 min. */
export async function fetchStandings(): Promise<FDStandingGroup[]> {
  const hit = lsGet<FDStandingGroup[]>('wc_standings', LS_TTL_MS);
  if (hit) { console.log('[WC API] STANDINGS cache hit'); return hit; }
  try {
    const data = await apiFetch<unknown>('/wc/standings?stage=group');
    console.log('[WC API] STANDINGS RAW (fetchStandings):', JSON.stringify(data, null, 2));
    const parsed = parseStandingsResponse(data);
    const result = parsed.length > 0 ? parsed : buildFallbackStandings();
    lsSet('wc_standings', result);
    return result;
  } catch {
    return lsGetStale<FDStandingGroup[]>('wc_standings') ?? buildFallbackStandings();
  }
}

/** Group draw via /wc/draw?stage=group. Returns empty map on failure. Cached 2 min. */
export async function fetchGroupDraw(): Promise<GroupDraw> {
  const hit = lsGet<GroupDraw>('wc_draw', LS_TTL_MS);
  if (hit) return hit;
  try {
    const data = await apiFetch<unknown>('/wc/draw?stage=group');
    const draw = parseDrawResponse(data);
    lsSet('wc_draw', draw);
    return draw;
  } catch {
    return lsGetStale<GroupDraw>('wc_draw') ?? {};
  }
}

/** Match detail via /wc/match/{id}/detail. Also stores raw response for fallback. */
export async function fetchMatchDetail(matchId: number): Promise<FDMatch | null> {
  const key = `wc_detail_${matchId}`;
  const hit = lsGet<FDMatch>(key, DETAIL_TTL);
  if (hit) return hit;
  // Prefer string matchId from draw data (e.g. "0d37d860f777")
  const strId = getStringMatchId(matchId) ?? String(matchId);
  try {
    const data = await apiFetch<unknown>(`/wc/match/${strId}/detail`);
    const d = data as Record<string, unknown>;
    const raw = (d.match ?? d.data ?? d) as RawMatch;
    const match = toFDMatch(raw);
    if (d.statistics || d.stats) {
      const stats = parseStatsResponse(data);
      if (stats.length > 0) lsSet(`wc_stats_${matchId}`, stats);
    }
    lsSet(key, match);
    return match;
  } catch {
    return lsGetStale<FDMatch>(key) ?? null;
  }
}

/** Match stats via /wc/match/{id}/stats. Falls back to extracting from detail. */
export async function fetchMatchStats(matchId: number): Promise<MatchStatItem[]> {
  const key = `wc_stats_${matchId}`;
  const hit = lsGet<MatchStatItem[]>(key, DETAIL_TTL);
  if (hit) return hit;
  const strId = getStringMatchId(matchId) ?? String(matchId);
  try {
    const data = await apiFetch<unknown>(`/wc/match/${strId}/stats`);
    const stats = parseStatsResponse(data);
    if (stats.length > 0) {
      lsSet(key, stats);
      return stats;
    }
    console.log(`[WC API] Stats empty for match ${strId}, trying detail endpoint`);
    const detail = await apiFetch<unknown>(`/wc/match/${strId}/detail`);
    const fallbackStats = parseStatsResponse(detail);
    lsSet(key, fallbackStats);
    return fallbackStats;
  } catch {
    return lsGetStale<MatchStatItem[]>(key) ?? [];
  }
}

/** Match lineups via /wc/match/{id}/lineups. */
export async function fetchMatchLineups(matchId: number): Promise<MatchLineup> {
  const key = `wc_lineups_${matchId}`;
  const hit = lsGet<MatchLineup>(key, DETAIL_TTL);
  if (hit) return hit;
  const strId = getStringMatchId(matchId) ?? String(matchId);
  try {
    const data = await apiFetch<unknown>(`/wc/match/${strId}/lineups`);
    const lineups = parseLineupResponse(data);
    lsSet(key, lineups);
    return lineups;
  } catch {
    return lsGetStale<MatchLineup>(key) ?? parseLineupResponse(null);
  }
}

/** Match commentary via /wc/match/{id}/commentary. */
export async function fetchMatchCommentary(matchId: number): Promise<CommentaryEvent[]> {
  const key = `wc_commentary_${matchId}`;
  const hit = lsGet<CommentaryEvent[]>(key, DETAIL_TTL);
  if (hit) return hit;
  const strId = getStringMatchId(matchId) ?? String(matchId);
  try {
    const data = await apiFetch<unknown>(`/wc/match/${strId}/commentary`);
    const events = parseCommentaryResponse(data);
    lsSet(key, events);
    return events;
  } catch {
    return lsGetStale<CommentaryEvent[]>(key) ?? [];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  Mexico: '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Korea Republic': '🇰🇷',
  Czechia: '🇨🇿', 'Czech Republic': '🇨🇿', Canada: '🇨🇦',
  'Bosnia and Herzegovina': '🇧🇦', 'Bosnia & Herzegovina': '🇧🇦',
  Qatar: '🇶🇦', Switzerland: '🇨🇭', Brazil: '🇧🇷', Morocco: '🇲🇦',
  Haiti: '🇭🇹', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', USA: '🇺🇸', 'United States': '🇺🇸',
  Paraguay: '🇵🇾', Australia: '🇦🇺', Turkey: '🇹🇷', Germany: '🇩🇪',
  "Côte d'Ivoire": '🇨🇮', "Cote d'Ivoire": '🇨🇮', 'Ivory Coast': '🇨🇮',
  Ecuador: '🇪🇨', Netherlands: '🇳🇱', Japan: '🇯🇵', Sweden: '🇸🇪', Tunisia: '🇹🇳',
  Belgium: '🇧🇪', Egypt: '🇪🇬', Iran: '🇮🇷', 'New Zealand': '🇳🇿',
  Spain: '🇪🇸', 'Cape Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', Uruguay: '🇺🇾',
  France: '🇫🇷', Senegal: '🇸🇳', Iraq: '🇮🇶', Norway: '🇳🇴',
  Argentina: '🇦🇷', Algeria: '🇩🇿', Austria: '🇦🇹', Jordan: '🇯🇴',
  Portugal: '🇵🇹', 'DR Congo': '🇨🇩', 'Congo DR': '🇨🇩', 'Democratic Republic of the Congo': '🇨🇩',
  Uzbekistan: '🇺🇿', Colombia: '🇨🇴', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Croatia: '🇭🇷', Ghana: '🇬🇭', Panama: '🇵🇦',
  'Curaçao': '🇨🇼', Curacao: '🇨🇼',
};

export function getFlag(name: string | null | undefined): string {
  if (!name) return '🏳';
  return COUNTRY_FLAGS[name] ?? '🏳';
}

export function isLiveStatus(status: MatchStatus | string): boolean {
  return status === 'IN_PLAY' || status === 'PAUSED';
}

export function isFinishedStatus(status: MatchStatus | string): boolean {
  return status === 'FINISHED' || status === 'AWARDED';
}

export function normaliseStage(stage: string | null | undefined): string {
  if (!stage) return '';
  const s = String(stage).toUpperCase();
  if (s.includes('GROUP')) return 'Group Stage';
  if (s === 'LAST_32' || s.includes('32')) return 'Round of 32';
  if (s === 'LAST_16' || s.includes('16')) return 'Round of 16';
  if (s.includes('QUARTER')) return 'Quarterfinals';
  if (s.includes('SEMI')) return 'Semifinals';
  if (s.includes('THIRD')) return 'Third Place';
  if (s === 'FINAL') return 'Final';
  return String(stage);
}
export function formatKickoff(utcDate: string): string {
 return new Date(utcDate).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  });
}

export function parseGroupLetter(group: string | null | undefined): string {
  if (!group) return '';
  const m = group.match(/[A-L]$/);
  return m ? m[0] : group;
}

export function lastUpdatedLabel(key: string): string {
  const age = cacheAge(key);
  if (age === null) return 'never';
  const mins = Math.floor(age / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
