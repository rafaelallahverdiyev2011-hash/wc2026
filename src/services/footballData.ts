// World Cup 2026 Live API (RapidAPI) — world-cup-2026-live-api.p.rapidapi.com
// Dev: Vite proxy /rapidapi/* → API host
// Prod: Supabase Edge Function at football-proxy

export const HARDCODED_RESULTS: Record<string, { home: number; away: number }> = {
  // Round of 32 (hardcoded — API does not support playoff stage)
  "South Africa_Canada":              { home: 0, away: 1 },
  "Canada_South Africa":              { home: 1, away: 0 },
  "Brazil_Japan":                     { home: 2, away: 1 },
  "Japan_Brazil":                     { home: 1, away: 2 },
  "Germany_Paraguay":                 { home: 1, away: 1 },
  "Paraguay_Germany":                 { home: 1, away: 1 },
  "Netherlands_Morocco":              { home: 1, away: 1 },
  "Morocco_Netherlands":              { home: 1, away: 1 },
  "Ivory Coast_Norway":               { home: 1, away: 2 },
  "Norway_Ivory Coast":               { home: 2, away: 1 },
  "France_Sweden":                    { home: 3, away: 0 },
  "Sweden_France":                    { home: 0, away: 3 },
  "Mexico_Ecuador":                   { home: 2, away: 0 },
  "Ecuador_Mexico":                   { home: 0, away: 2 },
  "England_D.R. Congo":               { home: 2, away: 1 },
  "D.R. Congo_England":               { home: 1, away: 2 },
  "Belgium_Senegal":                  { home: 3, away: 2 },
  "Senegal_Belgium":                  { home: 2, away: 3 },
  "USA_Bosnia & Herzegovina":         { home: 2, away: 0 },
  "Bosnia & Herzegovina_USA":         { home: 0, away: 2 },
  "Spain_Austria":                    { home: 3, away: 0 },
  "Austria_Spain":                    { home: 0, away: 3 },
  "Portugal_Croatia":                 { home: 2, away: 1 },
  "Croatia_Portugal":                 { home: 1, away: 2 },
  "Switzerland_Algeria":              { home: 2, away: 0 },
  "Algeria_Switzerland":              { home: 0, away: 2 },
  "Australia_Egypt":                  { home: 1, away: 1 },
  "Egypt_Australia":                  { home: 1, away: 1 },
  "Argentina_Cape Verde":             { home: 3, away: 2 },
  "Cape Verde_Argentina":             { home: 2, away: 3 },
  "Colombia_Ghana":                   { home: 1, away: 0 },
  "Ghana_Colombia":                   { home: 0, away: 1 },
  // Round of 16
  "Canada_Morocco":            { home: 0, away: 3 },
  "Morocco_Canada":            { home: 3, away: 0 },
  "Paraguay_France":           { home: 0, away: 1 },
  "France_Paraguay":           { home: 1, away: 0 },
  "Brazil_Norway":             { home: 1, away: 2 },
  "Norway_Brazil":             { home: 2, away: 1 },
  "Mexico_England":            { home: 2, away: 3 },
  "England_Mexico":            { home: 3, away: 2 },
  "Portugal_Spain":            { home: 0, away: 1 },
  "Spain_Portugal":            { home: 1, away: 0 },
  "USA_Belgium":               { home: 1, away: 4 },
  "Belgium_USA":               { home: 4, away: 1 },
  "Egypt_Argentina":           { home: 2, away: 3 },
  "Argentina_Egypt":           { home: 3, away: 2 },
  "Colombia_Switzerland":      { home: 0, away: 0 },
  "Switzerland_Colombia":      { home: 0, away: 0 },
  // Group stage (legacy)
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
    console.log('[WC API] KNOCKOUT RAW:', JSON.stringify(knockoutData, null, 2));
    const apiKnockout = knockoutData ? parseDrawMatches(knockoutData, {}) : [];
    console.log('[WC API] KNOCKOUT PARSED:', apiKnockout.length, 'matches');
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


export const HARDCODED_LINEUPS: Record<string, MatchLineup> = {
  // Round of 16
  "Canada_Morocco": {
    homeTeam: "Canada", awayTeam: "Morocco",
    homeFormation: "4-4-2", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Maxime Crépeau",number:16,position:"GK"},
      {id:2,name:"Alistair Johnston",number:2,position:"RB"},
      {id:3,name:"Moïse Bombito",number:15,position:"CB"},
      {id:4,name:"Luc de Fougerolles",number:4,position:"CB"},
      {id:5,name:"Richie Laryea",number:22,position:"LB"},
      {id:6,name:"Tajon Buchanan",number:17,position:"RM"},
      {id:7,name:"Niko Sigur",number:23,position:"CM"},
      {id:8,name:"Stephen Eustáquio",number:7,position:"CM"},
      {id:9,name:"Ali Ahmed",number:26,position:"LM"},
      {id:10,name:"Jonathan David",number:10,position:"CF"},
      {id:11,name:"Tani Oluwaseyi",number:12,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Alphonso Davies",number:19,position:"DF"},
      {id:13,name:"Jacob Shaffelburg",number:14,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Yassine Bounou",number:1,position:"GK"},
      {id:21,name:"Achraf Hakimi",number:2,position:"RB"},
      {id:22,name:"Issa Diop",number:14,position:"CB"},
      {id:23,name:"Redouane Halhal",number:5,position:"CB"},
      {id:24,name:"Noussair Mazraoui",number:3,position:"LB"},
      {id:25,name:"Ayyoub Bouaddi",number:6,position:"CM"},
      {id:26,name:"Neil El Aynaoui",number:24,position:"CM"},
      {id:27,name:"Brahim Díaz",number:10,position:"RW"},
      {id:28,name:"Azzedine Ounahi",number:8,position:"AM"},
      {id:29,name:"Bilal El Khannouss",number:23,position:"LW"},
      {id:30,name:"Ismael Saibari",number:11,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Soufiane Rahimi",number:9,position:"FW"},
      {id:32,name:"Chemsdine Talbi",number:7,position:"MF"},
    ],
  },
  "Paraguay_France": {
    homeTeam: "Paraguay", awayTeam: "France",
    homeFormation: "4-4-2", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Orlando Gill",number:12,position:"GK"},
      {id:2,name:"Juan José Cáceres",number:4,position:"RB"},
      {id:3,name:"Gustavo Gómez",number:15,position:"CB"},
      {id:4,name:"José Canale",number:13,position:"CB"},
      {id:5,name:"Júnior Alonso",number:6,position:"LB"},
      {id:6,name:"Maurício",number:11,position:"RM"},
      {id:7,name:"Andrés Cubas",number:14,position:"CM"},
      {id:8,name:"Matías Galarza",number:23,position:"CM"},
      {id:9,name:"Gustavo Caballero",number:24,position:"LM"},
      {id:10,name:"Antonio Sanabria",number:9,position:"CF"},
      {id:11,name:"Julio Enciso",number:19,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Gabriel Ávalos",number:21,position:"FW"},
      {id:13,name:"Damián Bobadilla",number:16,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Mike Maignan",number:16,position:"GK"},
      {id:21,name:"Jules Koundé",number:5,position:"RB"},
      {id:22,name:"Dayot Upamecano",number:4,position:"CB"},
      {id:23,name:"William Saliba",number:17,position:"CB"},
      {id:24,name:"Lucas Digne",number:3,position:"LB"},
      {id:25,name:"Aurélien Tchouaméni",number:8,position:"CM"},
      {id:26,name:"Adrien Rabiot",number:14,position:"CM"},
      {id:27,name:"Ousmane Dembélé",number:7,position:"RW"},
      {id:28,name:"Michael Olise",number:11,position:"AM"},
      {id:29,name:"Bradley Barcola",number:12,position:"LW"},
      {id:30,name:"Kylian Mbappé",number:10,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Désiré Doué",number:20,position:"FW"},
      {id:32,name:"Rayan Cherki",number:24,position:"MF"},
    ],
  },
  "Brazil_Norway": {
    homeTeam: "Brazil", awayTeam: "Norway",
    homeFormation: "4-3-3", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Alisson",number:1,position:"GK"},
      {id:2,name:"Danilo Luiz",number:13,position:"RB"},
      {id:3,name:"Marquinhos",number:4,position:"CB"},
      {id:4,name:"Gabriel Magalhães",number:3,position:"CB"},
      {id:5,name:"Douglas Santos",number:16,position:"LB"},
      {id:6,name:"Casemiro",number:5,position:"DM"},
      {id:7,name:"Bruno Guimarães",number:8,position:"CM"},
      {id:8,name:"Lucas Paquetá",number:20,position:"CM"},
      {id:9,name:"Rayan",number:26,position:"RF"},
      {id:10,name:"Endrick",number:19,position:"CF"},
      {id:11,name:"Vinícius Júnior",number:7,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Gabriel Martinelli",number:22,position:"FW"},
      {id:13,name:"Matheus Cunha",number:9,position:"FW"},
    ],
    awayStartXI: [
      {id:20,name:"Ørjan Nyland",number:1,position:"GK"},
      {id:21,name:"Marcus Holmgren Pedersen",number:16,position:"RB"},
      {id:22,name:"Kristoffer Ajer",number:3,position:"CB"},
      {id:23,name:"Torbjørn Heggem",number:17,position:"CB"},
      {id:24,name:"David Møller Wolfe",number:5,position:"LB"},
      {id:25,name:"Patrick Berg",number:6,position:"CM"},
      {id:26,name:"Sander Berge",number:8,position:"CM"},
      {id:27,name:"Martin Ødegaard",number:10,position:"AM"},
      {id:28,name:"Alexander Sørloth",number:7,position:"RF"},
      {id:29,name:"Erling Haaland",number:9,position:"CF"},
      {id:30,name:"Antonio Nusa",number:20,position:"LF"},
    ],
    awaySubs: [
      {id:31,name:"Oscar Bobb",number:22,position:"MF"},
      {id:32,name:"Andreas Schjelderup",number:21,position:"MF"},
    ],
  },
  "Mexico_England": {
    homeTeam: "Mexico", awayTeam: "England",
    homeFormation: "4-3-3", awayFormation: "4-3-3",
    homeStartXI: [
      {id:1,name:"Raúl Rangel",number:1,position:"GK"},
      {id:2,name:"Jorge Sánchez",number:2,position:"RB"},
      {id:3,name:"César Montes",number:3,position:"CB"},
      {id:4,name:"Johan Vásquez",number:5,position:"CB"},
      {id:5,name:"Jesús Gallardo",number:23,position:"LB"},
      {id:6,name:"Érik Lira",number:6,position:"DM"},
      {id:7,name:"Brian Gutiérrez",number:26,position:"CM"},
      {id:8,name:"Luis Romo",number:7,position:"CM"},
      {id:9,name:"Roberto Alvarado",number:25,position:"RF"},
      {id:10,name:"Santiago Giménez",number:11,position:"CF"},
      {id:11,name:"Julián Quiñones",number:16,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Raúl Jiménez",number:9,position:"FW"},
      {id:13,name:"Orbelín Pineda",number:17,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Jordan Pickford",number:1,position:"GK"},
      {id:21,name:"Djed Spence",number:25,position:"RB"},
      {id:22,name:"Ezri Konsa",number:2,position:"CB"},
      {id:23,name:"Marc Guéhi",number:6,position:"CB"},
      {id:24,name:"Nico O'Reilly",number:3,position:"LB"},
      {id:25,name:"Elliot Anderson",number:8,position:"CM"},
      {id:26,name:"Declan Rice",number:4,position:"CM"},
      {id:27,name:"Bukayo Saka",number:7,position:"RW"},
      {id:28,name:"Jude Bellingham",number:10,position:"AM"},
      {id:29,name:"Anthony Gordon",number:18,position:"LW"},
      {id:30,name:"Harry Kane",number:9,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Eberechi Eze",number:21,position:"MF"},
      {id:32,name:"Marcus Rashford",number:11,position:"FW"},
    ],
  },
  "Portugal_Spain": {
    homeTeam: "Portugal", awayTeam: "Spain",
    homeFormation: "4-3-3", awayFormation: "4-3-3",
    homeStartXI: [
      {id:1,name:"Diogo Costa",number:1,position:"GK"},
      {id:2,name:"João Cancelo",number:20,position:"RB"},
      {id:3,name:"Rúben Dias",number:3,position:"CB"},
      {id:4,name:"Renato Veiga",number:13,position:"CB"},
      {id:5,name:"Nuno Mendes",number:25,position:"LB"},
      {id:6,name:"João Neves",number:15,position:"CM"},
      {id:7,name:"Bernardo Silva",number:10,position:"CM"},
      {id:8,name:"Bruno Fernandes",number:8,position:"AM"},
      {id:9,name:"Pedro Neto",number:18,position:"RW"},
      {id:10,name:"Rafael Leão",number:17,position:"LW"},
      {id:11,name:"Cristiano Ronaldo",number:7,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Gonçalo Ramos",number:9,position:"FW"},
      {id:13,name:"Francisco Conceição",number:26,position:"FW"},
    ],
    awayStartXI: [
      {id:20,name:"Unai Simón",number:23,position:"GK"},
      {id:21,name:"Pedro Porro",number:12,position:"RB"},
      {id:22,name:"Pau Cubarsí",number:22,position:"CB"},
      {id:23,name:"Aymeric Laporte",number:14,position:"CB"},
      {id:24,name:"Marc Cucurella",number:24,position:"LB"},
      {id:25,name:"Rodri",number:16,position:"DM"},
      {id:26,name:"Pedri",number:20,position:"CM"},
      {id:27,name:"Dani Olmo",number:10,position:"CM"},
      {id:28,name:"Lamine Yamal",number:19,position:"RF"},
      {id:29,name:"Mikel Oyarzabal",number:21,position:"CF"},
      {id:30,name:"Álex Baena",number:15,position:"LF"},
    ],
    awaySubs: [
      {id:31,name:"Mikel Merino",number:6,position:"MF"},
      {id:32,name:"Ferran Torres",number:7,position:"FW"},
    ],
  },
  "USA_Belgium": {
    homeTeam: "USA", awayTeam: "Belgium",
    homeFormation: "3-4-3", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Matt Freese",number:24,position:"GK"},
      {id:2,name:"Alex Freeman",number:16,position:"CB"},
      {id:3,name:"Chris Richards",number:3,position:"CB"},
      {id:4,name:"Tim Ream",number:13,position:"CB"},
      {id:5,name:"Sergiño Dest",number:2,position:"RM"},
      {id:6,name:"Weston McKennie",number:8,position:"CM"},
      {id:7,name:"Tyler Adams",number:4,position:"CM"},
      {id:8,name:"Malik Tillman",number:17,position:"CM"},
      {id:9,name:"Antonee Robinson",number:5,position:"LM"},
      {id:10,name:"Christian Pulisic",number:10,position:"CF"},
      {id:11,name:"Ricardo Pepi",number:9,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Giovanni Reyna",number:7,position:"MF"},
      {id:13,name:"Sebastian Berhalter",number:14,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Thibaut Courtois",number:1,position:"GK"},
      {id:21,name:"Timothy Castagne",number:21,position:"RB"},
      {id:22,name:"Brandon Mechele",number:4,position:"CB"},
      {id:23,name:"Arthur Theate",number:3,position:"CB"},
      {id:24,name:"Maxim De Cuyper",number:5,position:"LB"},
      {id:25,name:"Youri Tielemans",number:8,position:"CM"},
      {id:26,name:"Hans Vanaken",number:20,position:"CM"},
      {id:27,name:"Leandro Trossard",number:10,position:"RW"},
      {id:28,name:"Kevin De Bruyne",number:7,position:"AM"},
      {id:29,name:"Jérémy Doku",number:11,position:"LW"},
      {id:30,name:"Romelu Lukaku",number:9,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Dodi Lukébakio",number:14,position:"FW"},
      {id:32,name:"Charles De Ketelaere",number:17,position:"FW"},
    ],
  },
  "Argentina_Egypt": {
    homeTeam: "Argentina", awayTeam: "Egypt",
    homeFormation: "4-2-3-1", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Emiliano Martínez",number:23,position:"GK"},
      {id:2,name:"Nahuel Molina",number:26,position:"RB"},
      {id:3,name:"Cristian Romero",number:13,position:"CB"},
      {id:4,name:"Lisandro Martínez",number:6,position:"CB"},
      {id:5,name:"Nicolás Tagliafico",number:3,position:"LB"},
      {id:6,name:"Rodrigo De Paul",number:7,position:"RM"},
      {id:7,name:"Alexis Mac Allister",number:20,position:"CM"},
      {id:8,name:"Enzo Fernández",number:24,position:"CM"},
      {id:9,name:"Nico González",number:15,position:"LM"},
      {id:10,name:"Lionel Messi",number:10,position:"CF"},
      {id:11,name:"Lautaro Martínez",number:22,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Julián Alvarez",number:9,position:"FW"},
      {id:13,name:"Leandro Paredes",number:5,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Mostafa Shobeir",number:23,position:"GK"},
      {id:21,name:"Mohamed Hany",number:3,position:"RB"},
      {id:22,name:"Yasser Ibrahim",number:2,position:"CB"},
      {id:23,name:"Ramy Rabia",number:5,position:"CB"},
      {id:24,name:"Karim Hafez",number:15,position:"LB"},
      {id:25,name:"Emam Ashour",number:8,position:"RM"},
      {id:26,name:"Hamdy Fathy",number:14,position:"CM"},
      {id:27,name:"Marwan Attia",number:19,position:"CM"},
      {id:28,name:"Haissem Hassan",number:12,position:"LM"},
      {id:29,name:"Mohamed Salah",number:10,position:"CF"},
      {id:30,name:"Omar Marmoush",number:22,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Mahmoud Saber",number:21,position:"MF"},
      {id:32,name:"Hossam Abdelmaguid",number:4,position:"DF"},
    ],
  },
  "Switzerland_Colombia": {
    homeTeam: "Switzerland", awayTeam: "Colombia",
    homeFormation: "4-2-3-1", awayFormation: "4-3-3",
    homeStartXI: [
      {id:1,name:"Gregor Kobel",number:1,position:"GK"},
      {id:2,name:"Denis Zakaria",number:6,position:"RB"},
      {id:3,name:"Nico Elvedi",number:4,position:"CB"},
      {id:4,name:"Manuel Akanji",number:5,position:"CB"},
      {id:5,name:"Ricardo Rodriguez",number:13,position:"LB"},
      {id:6,name:"Remo Freuler",number:8,position:"CM"},
      {id:7,name:"Granit Xhaka",number:10,position:"CM"},
      {id:8,name:"Dan Ndoye",number:11,position:"RW"},
      {id:9,name:"Fabian Rieder",number:22,position:"AM"},
      {id:10,name:"Rubén Vargas",number:17,position:"LW"},
      {id:11,name:"Breel Embolo",number:7,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Noah Okafor",number:19,position:"FW"},
      {id:13,name:"Zeki Amdouni",number:23,position:"FW"},
    ],
    awayStartXI: [
      {id:20,name:"Camilo Vargas",number:12,position:"GK"},
      {id:21,name:"Daniel Muñoz",number:2,position:"RB"},
      {id:22,name:"Davinson Sánchez",number:23,position:"CB"},
      {id:23,name:"Jhon Lucumí",number:3,position:"CB"},
      {id:24,name:"Johan Mojica",number:17,position:"LB"},
      {id:25,name:"Jefferson Lerma",number:16,position:"DM"},
      {id:26,name:"Richard Ríos",number:6,position:"CM"},
      {id:27,name:"Gustavo Puerta",number:14,position:"CM"},
      {id:28,name:"James Rodríguez",number:10,position:"RF"},
      {id:29,name:"Luis Díaz",number:7,position:"LF"},
      {id:30,name:"Luis Suárez",number:25,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Jhon Córdoba",number:9,position:"FW"},
      {id:32,name:"Juan Quintero",number:20,position:"MF"},
    ],
  },

  "South Africa_Canada": {
    homeTeam: "South Africa", awayTeam: "Canada",
    homeFormation: "4-3-3", awayFormation: "4-4-2",
    homeStartXI: [
      {id:1,name:"Ronwen Williams",number:1,position:"GK"},
      {id:2,name:"Khuliso Mudau",number:20,position:"RB"},
      {id:3,name:"Ime Okon",number:21,position:"CB"},
      {id:4,name:"Mbekezeli Mbokazi",number:14,position:"CB"},
      {id:5,name:"Aubrey Modiba",number:6,position:"LB"},
      {id:6,name:"Sphephelo Sithole",number:13,position:"CM"},
      {id:7,name:"Teboho Mokoena",number:4,position:"CM"},
      {id:8,name:"Thapelo Maseko",number:12,position:"RW"},
      {id:9,name:"Relebohile Mofokeng",number:10,position:"AM"},
      {id:10,name:"Oswin Appollis",number:7,position:"LW"},
      {id:11,name:"Evidence Makgopa",number:17,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Thalente Mbatha",number:5,position:"MF"},
      {id:13,name:"Iqraam Rayners",number:15,position:"FW"},
      {id:14,name:"Tshepang Moremi",number:8,position:"FW"},
    ],
    awayStartXI: [
      {id:20,name:"Maxime Crépeau",number:16,position:"GK"},
      {id:21,name:"Alistair Johnston",number:2,position:"RB"},
      {id:22,name:"Moïse Bombito",number:15,position:"CB"},
      {id:23,name:"Derek Cornelius",number:13,position:"CB"},
      {id:24,name:"Richie Laryea",number:22,position:"LB"},
      {id:25,name:"Tajon Buchanan",number:17,position:"RM"},
      {id:26,name:"Nathan Saliba",number:25,position:"CM"},
      {id:27,name:"Stephen Eustáquio",number:7,position:"CM"},
      {id:28,name:"Liam Millar",number:11,position:"LM"},
      {id:29,name:"Jonathan David",number:10,position:"CF"},
      {id:30,name:"Tani Oluwaseyi",number:12,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Niko Sigur",number:23,position:"DF"},
      {id:32,name:"Luc de Fougerolles",number:4,position:"DF"},
      {id:33,name:"Promise David",number:24,position:"FW"},
      {id:34,name:"Jacob Shaffelburg",number:14,position:"MF"},
      {id:35,name:"Alphonso Davies",number:19,position:"DF"},
    ],
  },
  "Brazil_Japan": {
    homeTeam: "Brazil", awayTeam: "Japan",
    homeFormation: "4-3-3", awayFormation: "3-4-3",
    homeStartXI: [
      {id:1,name:"Alisson",number:1,position:"GK"},
      {id:2,name:"Danilo Luiz",number:13,position:"RB"},
      {id:3,name:"Marquinhos",number:4,position:"CB"},
      {id:4,name:"Gabriel Magalhães",number:3,position:"CB"},
      {id:5,name:"Douglas Santos",number:16,position:"LB"},
      {id:6,name:"Casemiro",number:5,position:"DM"},
      {id:7,name:"Bruno Guimarães",number:8,position:"CM"},
      {id:8,name:"Lucas Paquetá",number:20,position:"CM"},
      {id:9,name:"Rayan",number:26,position:"RF"},
      {id:10,name:"Matheus Cunha",number:9,position:"CF"},
      {id:11,name:"Vinícius Júnior",number:7,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Endrick",number:19,position:"FW"},
      {id:13,name:"Gabriel Martinelli",number:22,position:"FW"},
      {id:14,name:"Fabinho",number:17,position:"MF"},
      {id:15,name:"Danilo Santos",number:18,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Zion Suzuki",number:1,position:"GK"},
      {id:21,name:"Takehiro Tomiyasu",number:22,position:"CB"},
      {id:22,name:"Shōgo Taniguchi",number:3,position:"CB"},
      {id:23,name:"Hiroki Itō",number:21,position:"CB"},
      {id:24,name:"Ritsu Dōan",number:10,position:"RM"},
      {id:25,name:"Kaishū Sano",number:24,position:"CM"},
      {id:26,name:"Daichi Kamada",number:15,position:"CM"},
      {id:27,name:"Keito Nakamura",number:13,position:"LM"},
      {id:28,name:"Junya Itō",number:14,position:"RF"},
      {id:29,name:"Ayase Ueda",number:18,position:"CF"},
      {id:30,name:"Daizen Maeda",number:11,position:"LF"},
    ],
    awaySubs: [
      {id:31,name:"Junnosuke Suzuki",number:25,position:"DF"},
      {id:32,name:"Yukinari Sugawara",number:2,position:"DF"},
      {id:33,name:"Ao Tanaka",number:7,position:"MF"},
      {id:34,name:"Shūto Machino",number:6,position:"FW"},
      {id:35,name:"Kōki Ogawa",number:19,position:"FW"},
    ],
  },
  "Germany_Paraguay": {
    homeTeam: "Germany", awayTeam: "Paraguay",
    homeFormation: "4-2-3-1", awayFormation: "4-4-2",
    homeStartXI: [
      {id:1,name:"Manuel Neuer",number:1,position:"GK"},
      {id:2,name:"Joshua Kimmich",number:6,position:"RB"},
      {id:3,name:"Jonathan Tah",number:4,position:"CB"},
      {id:4,name:"Antonio Rüdiger",number:2,position:"CB"},
      {id:5,name:"Nathaniel Brown",number:18,position:"LB"},
      {id:6,name:"Felix Nmecha",number:23,position:"CM"},
      {id:7,name:"Aleksandar Pavlović",number:5,position:"CM"},
      {id:8,name:"Leroy Sané",number:19,position:"RW"},
      {id:9,name:"Kai Havertz",number:7,position:"AM"},
      {id:10,name:"Florian Wirtz",number:17,position:"LW"},
      {id:11,name:"Deniz Undav",number:26,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Leon Goretzka",number:8,position:"MF"},
      {id:13,name:"Jamal Musiala",number:10,position:"MF"},
      {id:14,name:"Waldemar Anton",number:3,position:"DF"},
      {id:15,name:"Nick Woltemade",number:11,position:"FW"},
      {id:16,name:"Nadiem Amiri",number:20,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Orlando Gill",number:12,position:"GK"},
      {id:21,name:"Juan José Cáceres",number:4,position:"RB"},
      {id:22,name:"Gustavo Gómez",number:15,position:"CB"},
      {id:23,name:"José Canale",number:13,position:"CB"},
      {id:24,name:"Júnior Alonso",number:6,position:"LB"},
      {id:25,name:"Miguel Almirón",number:10,position:"RM"},
      {id:26,name:"Damián Bobadilla",number:16,position:"CM"},
      {id:27,name:"Andrés Cubas",number:14,position:"CM"},
      {id:28,name:"Matías Galarza",number:23,position:"LM"},
      {id:29,name:"Gabriel Ávalos",number:21,position:"CF"},
      {id:30,name:"Julio Enciso",number:19,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Gustavo Caballero",number:24,position:"MF"},
      {id:32,name:"Maurício",number:11,position:"MF"},
      {id:33,name:"Gustavo Velázquez",number:2,position:"DF"},
      {id:34,name:"Antonio Sanabria",number:9,position:"FW"},
      {id:35,name:"Fabián Balbuena",number:5,position:"DF"},
    ],
  },
  "Netherlands_Morocco": {
    homeTeam: "Netherlands", awayTeam: "Morocco",
    homeFormation: "3-4-3", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Bart Verbruggen",number:1,position:"GK"},
      {id:2,name:"Jan Paul van Hecke",number:6,position:"CB"},
      {id:3,name:"Virgil van Dijk",number:4,position:"CB"},
      {id:4,name:"Nathan Aké",number:5,position:"CB"},
      {id:5,name:"Denzel Dumfries",number:22,position:"RM"},
      {id:6,name:"Ryan Gravenberch",number:8,position:"CM"},
      {id:7,name:"Frenkie de Jong",number:21,position:"CM"},
      {id:8,name:"Micky van de Ven",number:15,position:"LM"},
      {id:9,name:"Crysencio Summerville",number:24,position:"RF"},
      {id:10,name:"Brian Brobbey",number:19,position:"CF"},
      {id:11,name:"Cody Gakpo",number:11,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Teun Koopmeiners",number:20,position:"MF"},
      {id:13,name:"Wout Weghorst",number:9,position:"FW"},
      {id:14,name:"Quinten Timber",number:26,position:"MF"},
      {id:15,name:"Jorrel Hato",number:25,position:"DF"},
      {id:16,name:"Justin Kluivert",number:7,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Yassine Bounou",number:1,position:"GK"},
      {id:21,name:"Achraf Hakimi",number:2,position:"RB"},
      {id:22,name:"Issa Diop",number:14,position:"CB"},
      {id:23,name:"Chadi Riad",number:18,position:"CB"},
      {id:24,name:"Noussair Mazraoui",number:3,position:"LB"},
      {id:25,name:"Ayyoub Bouaddi",number:6,position:"CM"},
      {id:26,name:"Neil El Aynaoui",number:24,position:"CM"},
      {id:27,name:"Brahim Díaz",number:10,position:"RW"},
      {id:28,name:"Azzedine Ounahi",number:8,position:"AM"},
      {id:29,name:"Bilal El Khannouss",number:23,position:"LW"},
      {id:30,name:"Ismael Saibari",number:11,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Soufiane Rahimi",number:9,position:"FW"},
      {id:32,name:"Chemsdine Talbi",number:7,position:"MF"},
      {id:33,name:"Samir El Mourabet",number:15,position:"MF"},
    ],
  },
  "Ivory Coast_Norway": {
    homeTeam: "Ivory Coast", awayTeam: "Norway",
    homeFormation: "4-3-3", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Yahia Fofana",number:1,position:"GK"},
      {id:2,name:"Guéla Doué",number:17,position:"RB"},
      {id:3,name:"Odilon Kossounou",number:7,position:"CB"},
      {id:4,name:"Emmanuel Agbadou",number:20,position:"CB"},
      {id:5,name:"Ghislain Konan",number:3,position:"LB"},
      {id:6,name:"Ibrahim Sangaré",number:18,position:"DM"},
      {id:7,name:"Franck Kessié",number:8,position:"CM"},
      {id:8,name:"Christ Inao Oulaï",number:26,position:"CM"},
      {id:9,name:"Nicolas Pépé",number:19,position:"RF"},
      {id:10,name:"Ange-Yoan Bonny",number:9,position:"CF"},
      {id:11,name:"Yan Diomande",number:11,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Amad Diallo",number:15,position:"FW"},
      {id:13,name:"Elye Wahi",number:12,position:"FW"},
    ],
    awayStartXI: [
      {id:20,name:"Ørjan Nyland",number:1,position:"GK"},
      {id:21,name:"Marcus Holmgren Pedersen",number:16,position:"RB"},
      {id:22,name:"Kristoffer Ajer",number:3,position:"CB"},
      {id:23,name:"Torbjørn Heggem",number:17,position:"CB"},
      {id:24,name:"David Møller Wolfe",number:5,position:"LB"},
      {id:25,name:"Patrick Berg",number:6,position:"CM"},
      {id:26,name:"Sander Berge",number:8,position:"CM"},
      {id:27,name:"Martin Ødegaard",number:10,position:"AM"},
      {id:28,name:"Alexander Sørloth",number:7,position:"RF"},
      {id:29,name:"Erling Haaland",number:9,position:"CF"},
      {id:30,name:"Antonio Nusa",number:20,position:"LF"},
    ],
    awaySubs: [
      {id:31,name:"Andreas Schjelderup",number:21,position:"MF"},
      {id:32,name:"Oscar Bobb",number:22,position:"MF"},
      {id:33,name:"Fredrik Aursnes",number:14,position:"MF"},
    ],
  },
  "France_Sweden": {
    homeTeam: "France", awayTeam: "Sweden",
    homeFormation: "4-2-3-1", awayFormation: "4-4-2",
    homeStartXI: [
      {id:1,name:"Mike Maignan",number:16,position:"GK"},
      {id:2,name:"Jules Koundé",number:5,position:"RB"},
      {id:3,name:"Dayot Upamecano",number:4,position:"CB"},
      {id:4,name:"William Saliba",number:17,position:"CB"},
      {id:5,name:"Lucas Digne",number:3,position:"LB"},
      {id:6,name:"Aurélien Tchouaméni",number:8,position:"CM"},
      {id:7,name:"Adrien Rabiot",number:14,position:"CM"},
      {id:8,name:"Ousmane Dembélé",number:7,position:"RW"},
      {id:9,name:"Michael Olise",number:11,position:"AM"},
      {id:10,name:"Bradley Barcola",number:12,position:"LW"},
      {id:11,name:"Kylian Mbappé",number:10,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Désiré Doué",number:20,position:"FW"},
      {id:13,name:"Malo Gusto",number:2,position:"DF"},
      {id:14,name:"Théo Hernandez",number:19,position:"DF"},
      {id:15,name:"Jean-Philippe Mateta",number:22,position:"FW"},
      {id:16,name:"Rayan Cherki",number:24,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Jacob Widell Zetterström",number:1,position:"GK"},
      {id:21,name:"Daniel Svensson",number:8,position:"RB"},
      {id:22,name:"Gustaf Lagerbielke",number:2,position:"CB"},
      {id:23,name:"Victor Lindelöf",number:3,position:"CB"},
      {id:24,name:"Gabriel Gudmundsson",number:5,position:"LB"},
      {id:25,name:"Anthony Elanga",number:11,position:"RM"},
      {id:26,name:"Lucas Bergvall",number:7,position:"CM"},
      {id:27,name:"Yasin Ayari",number:18,position:"CM"},
      {id:28,name:"Elliot Stroud",number:24,position:"LM"},
      {id:29,name:"Viktor Gyökeres",number:17,position:"CF"},
      {id:30,name:"Alexander Isak",number:9,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Taha Ali",number:26,position:"FW"},
      {id:32,name:"Besfort Zeneli",number:22,position:"MF"},
      {id:33,name:"Benjamin Nygren",number:10,position:"MF"},
    ],
  },
  "Mexico_Ecuador": {
    homeTeam: "Mexico", awayTeam: "Ecuador",
    homeFormation: "4-3-3", awayFormation: "4-4-2",
    homeStartXI: [
      {id:1,name:"Raúl Rangel",number:1,position:"GK"},
      {id:2,name:"Jorge Sánchez",number:2,position:"RB"},
      {id:3,name:"César Montes",number:3,position:"CB"},
      {id:4,name:"Johan Vásquez",number:5,position:"CB"},
      {id:5,name:"Jesús Gallardo",number:23,position:"LB"},
      {id:6,name:"Érik Lira",number:6,position:"DM"},
      {id:7,name:"Gilberto Mora",number:19,position:"CM"},
      {id:8,name:"Luis Romo",number:7,position:"CM"},
      {id:9,name:"Roberto Alvarado",number:25,position:"RF"},
      {id:10,name:"Raúl Jiménez",number:9,position:"CF"},
      {id:11,name:"Julián Quiñones",number:16,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Brian Gutiérrez",number:26,position:"MF"},
      {id:13,name:"Obed Vargas",number:18,position:"MF"},
      {id:14,name:"Santiago Giménez",number:11,position:"FW"},
      {id:15,name:"Israel Reyes",number:15,position:"DF"},
      {id:16,name:"Orbelín Pineda",number:17,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Hernán Galíndez",number:1,position:"GK"},
      {id:21,name:"Alan Franco",number:21,position:"RB"},
      {id:22,name:"Joel Ordóñez",number:4,position:"CB"},
      {id:23,name:"Willian Pacho",number:6,position:"CB"},
      {id:24,name:"Piero Hincapié",number:3,position:"LB"},
      {id:25,name:"John Yeboah",number:9,position:"RM"},
      {id:26,name:"Moisés Caicedo",number:23,position:"CM"},
      {id:27,name:"Pedro Vite",number:15,position:"CM"},
      {id:28,name:"Nilson Angulo",number:20,position:"LM"},
      {id:29,name:"Gonzalo Plata",number:19,position:"CF"},
      {id:30,name:"Enner Valencia",number:13,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Yaimar Medina",number:26,position:"MF"},
      {id:32,name:"Ángelo Preciado",number:17,position:"DF"},
      {id:33,name:"Kevin Rodríguez",number:11,position:"FW"},
      {id:34,name:"Kendry Páez",number:10,position:"MF"},
    ],
  },
  "England_D.R. Congo": {
    homeTeam: "England", awayTeam: "D.R. Congo",
    homeFormation: "4-3-3", awayFormation: "4-4-2",
    homeStartXI: [
      {id:1,name:"Jordan Pickford",number:1,position:"GK"},
      {id:2,name:"Djed Spence",number:25,position:"RB"},
      {id:3,name:"Ezri Konsa",number:2,position:"CB"},
      {id:4,name:"Marc Guéhi",number:6,position:"CB"},
      {id:5,name:"Nico O'Reilly",number:3,position:"LB"},
      {id:6,name:"Elliot Anderson",number:8,position:"CM"},
      {id:7,name:"Declan Rice",number:4,position:"CM"},
      {id:8,name:"Noni Madueke",number:20,position:"RW"},
      {id:9,name:"Jude Bellingham",number:10,position:"AM"},
      {id:10,name:"Marcus Rashford",number:11,position:"LW"},
      {id:11,name:"Harry Kane",number:9,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Bukayo Saka",number:7,position:"FW"},
      {id:13,name:"Anthony Gordon",number:18,position:"FW"},
      {id:14,name:"Eberechi Eze",number:21,position:"MF"},
      {id:15,name:"John Stones",number:5,position:"DF"},
    ],
    awayStartXI: [
      {id:20,name:"Lionel Mpasi",number:1,position:"GK"},
      {id:21,name:"Aaron Wan-Bissaka",number:2,position:"RB"},
      {id:22,name:"Chancel Mbemba",number:22,position:"CB"},
      {id:23,name:"Axel Tuanzebe",number:4,position:"CB"},
      {id:24,name:"Arthur Masuaku",number:26,position:"LB"},
      {id:25,name:"Samuel Moutoussamy",number:8,position:"DM"},
      {id:26,name:"Nathanaël Mbuku",number:7,position:"RM"},
      {id:27,name:"Ngal'ayel Mukau",number:6,position:"CM"},
      {id:28,name:"Noah Sadiki",number:14,position:"CM"},
      {id:29,name:"Brian Cipenga",number:9,position:"LM"},
      {id:30,name:"Yoane Wissa",number:20,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Meschak Elia",number:13,position:"FW"},
      {id:32,name:"Théo Bongonda",number:10,position:"MF"},
      {id:33,name:"Edo Kayembe",number:25,position:"MF"},
    ],
  },
  "Belgium_Senegal": {
    homeTeam: "Belgium", awayTeam: "Senegal",
    homeFormation: "4-2-3-1", awayFormation: "4-3-3",
    homeStartXI: [
      {id:1,name:"Thibaut Courtois",number:1,position:"GK"},
      {id:2,name:"Timothy Castagne",number:21,position:"RB"},
      {id:3,name:"Brandon Mechele",number:4,position:"CB"},
      {id:4,name:"Arthur Theate",number:3,position:"CB"},
      {id:5,name:"Maxim De Cuyper",number:5,position:"LB"},
      {id:6,name:"Hans Vanaken",number:20,position:"CM"},
      {id:7,name:"Youri Tielemans",number:8,position:"CM"},
      {id:8,name:"Leandro Trossard",number:10,position:"RW"},
      {id:9,name:"Kevin De Bruyne",number:7,position:"AM"},
      {id:10,name:"Jérémy Doku",number:11,position:"LW"},
      {id:11,name:"Charles De Ketelaere",number:17,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Romelu Lukaku",number:9,position:"FW"},
      {id:13,name:"Dodi Lukébakio",number:14,position:"FW"},
      {id:14,name:"Nicolas Raskin",number:23,position:"MF"},
      {id:15,name:"Thomas Meunier",number:15,position:"DF"},
    ],
    awayStartXI: [
      {id:20,name:"Mory Diaw",number:23,position:"GK"},
      {id:21,name:"Krépin Diatta",number:15,position:"RB"},
      {id:22,name:"Pathé Ciss",number:6,position:"CB"},
      {id:23,name:"Moussa Niakhaté",number:19,position:"CB"},
      {id:24,name:"Ismail Jakobs",number:14,position:"LB"},
      {id:25,name:"Habib Diarra",number:21,position:"CM"},
      {id:26,name:"Idrissa Gueye",number:5,position:"CM"},
      {id:27,name:"Pape Gueye",number:26,position:"CM"},
      {id:28,name:"Iliman Ndiaye",number:13,position:"RF"},
      {id:29,name:"Ismaïla Sarr",number:18,position:"CF"},
      {id:30,name:"Sadio Mané",number:10,position:"LF"},
    ],
    awaySubs: [
      {id:31,name:"Lamine Camara",number:8,position:"MF"},
      {id:32,name:"Pape Matar Sarr",number:17,position:"MF"},
      {id:33,name:"Nicolas Jackson",number:11,position:"FW"},
    ],
  },
  "USA_Bosnia & Herzegovina": {
    homeTeam: "USA", awayTeam: "Bosnia & Herzegovina",
    homeFormation: "3-4-3", awayFormation: "4-4-2",
    homeStartXI: [
      {id:1,name:"Matt Freese",number:24,position:"GK"},
      {id:2,name:"Alex Freeman",number:16,position:"CB"},
      {id:3,name:"Chris Richards",number:3,position:"CB"},
      {id:4,name:"Tim Ream",number:13,position:"CB"},
      {id:5,name:"Sergiño Dest",number:2,position:"RM"},
      {id:6,name:"Weston McKennie",number:8,position:"CM"},
      {id:7,name:"Tyler Adams",number:4,position:"CM"},
      {id:8,name:"Malik Tillman",number:17,position:"CM"},
      {id:9,name:"Antonee Robinson",number:5,position:"LM"},
      {id:10,name:"Christian Pulisic",number:10,position:"CF"},
      {id:11,name:"Folarin Balogun",number:20,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Sebastian Berhalter",number:14,position:"MF"},
      {id:13,name:"Ricardo Pepi",number:9,position:"FW"},
      {id:14,name:"Giovanni Reyna",number:7,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Nikola Vasilj",number:1,position:"GK"},
      {id:21,name:"Amar Dedić",number:7,position:"RB"},
      {id:22,name:"Nikola Katić",number:18,position:"CB"},
      {id:23,name:"Tarik Muharemović",number:4,position:"CB"},
      {id:24,name:"Stjepan Radeljić",number:21,position:"LB"},
      {id:25,name:"Armin Gigović",number:8,position:"RM"},
      {id:26,name:"Ivan Šunjić",number:14,position:"CM"},
      {id:27,name:"Kerim Alajbegović",number:19,position:"CM"},
      {id:28,name:"Sead Kolašinac",number:5,position:"LM"},
      {id:29,name:"Ermedin Demirović",number:10,position:"CF"},
      {id:30,name:"Edin Džeko",number:11,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Ermin Mahmić",number:26,position:"MF"},
      {id:32,name:"Benjamin Tahirović",number:6,position:"MF"},
      {id:33,name:"Haris Tabaković",number:23,position:"FW"},
    ],
  },
  "Spain_Austria": {
    homeTeam: "Spain", awayTeam: "Austria",
    homeFormation: "4-3-3", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Unai Simón",number:23,position:"GK"},
      {id:2,name:"Pedro Porro",number:12,position:"RB"},
      {id:3,name:"Pau Cubarsí",number:22,position:"CB"},
      {id:4,name:"Aymeric Laporte",number:14,position:"CB"},
      {id:5,name:"Marc Cucurella",number:24,position:"LB"},
      {id:6,name:"Rodri",number:16,position:"DM"},
      {id:7,name:"Dani Olmo",number:10,position:"CM"},
      {id:8,name:"Pedri",number:20,position:"CM"},
      {id:9,name:"Lamine Yamal",number:19,position:"RF"},
      {id:10,name:"Mikel Oyarzabal",number:21,position:"CF"},
      {id:11,name:"Álex Baena",number:15,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Ferran Torres",number:7,position:"FW"},
      {id:13,name:"Mikel Merino",number:6,position:"MF"},
      {id:14,name:"Gavi",number:9,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Alexander Schlager",number:1,position:"GK"},
      {id:21,name:"Stefan Posch",number:5,position:"RB"},
      {id:22,name:"Kevin Danso",number:3,position:"CB"},
      {id:23,name:"David Alaba",number:8,position:"CB"},
      {id:24,name:"Konrad Laimer",number:20,position:"LB"},
      {id:25,name:"Nicolas Seiwald",number:6,position:"CM"},
      {id:26,name:"Xaver Schlager",number:4,position:"CM"},
      {id:27,name:"Romano Schmid",number:18,position:"RW"},
      {id:28,name:"Paul Wanner",number:24,position:"AM"},
      {id:29,name:"Marcel Sabitzer",number:9,position:"LW"},
      {id:30,name:"Michael Gregoritsch",number:11,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Florian Grillitsch",number:10,position:"MF"},
      {id:32,name:"Carney Chukwuemeka",number:17,position:"MF"},
      {id:33,name:"Marko Arnautović",number:7,position:"FW"},
      {id:34,name:"Saša Kalajdžić",number:14,position:"FW"},
    ],
  },
  "Portugal_Croatia": {
    homeTeam: "Portugal", awayTeam: "Croatia",
    homeFormation: "4-3-3", awayFormation: "4-3-3",
    homeStartXI: [
      {id:1,name:"Diogo Costa",number:1,position:"GK"},
      {id:2,name:"João Cancelo",number:20,position:"RB"},
      {id:3,name:"Rúben Dias",number:3,position:"CB"},
      {id:4,name:"Renato Veiga",number:13,position:"CB"},
      {id:5,name:"Nuno Mendes",number:25,position:"LB"},
      {id:6,name:"João Neves",number:15,position:"CM"},
      {id:7,name:"Vitinha",number:23,position:"CM"},
      {id:8,name:"Pedro Neto",number:18,position:"RW"},
      {id:9,name:"Bruno Fernandes",number:8,position:"AM"},
      {id:10,name:"Rafael Leão",number:17,position:"LW"},
      {id:11,name:"Cristiano Ronaldo",number:7,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Bernardo Silva",number:10,position:"MF"},
      {id:13,name:"Nélson Semedo",number:2,position:"DF"},
      {id:14,name:"Francisco Conceição",number:26,position:"FW"},
      {id:15,name:"Gonçalo Ramos",number:9,position:"FW"},
      {id:16,name:"Rúben Neves",number:21,position:"MF"},
    ],
    awayStartXI: [
      {id:20,name:"Dominik Livaković",number:1,position:"GK"},
      {id:21,name:"Josip Stanišić",number:2,position:"RB"},
      {id:22,name:"Josip Šutalo",number:6,position:"CB"},
      {id:23,name:"Marin Pongračić",number:3,position:"CB"},
      {id:24,name:"Ivan Perišić",number:14,position:"LB"},
      {id:25,name:"Luka Modrić",number:10,position:"CM"},
      {id:26,name:"Mateo Kovačić",number:8,position:"CM"},
      {id:27,name:"Nikola Vlašić",number:13,position:"RW"},
      {id:28,name:"Petar Sučić",number:17,position:"AM"},
      {id:29,name:"Martin Baturina",number:16,position:"LW"},
      {id:30,name:"Ante Budimir",number:11,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Igor Matanović",number:20,position:"FW"},
      {id:32,name:"Mario Pašalić",number:15,position:"MF"},
      {id:33,name:"Joško Gvardiol",number:4,position:"DF"},
      {id:34,name:"Andrej Kramarić",number:9,position:"FW"},
    ],
  },
  "Switzerland_Algeria": {
    homeTeam: "Switzerland", awayTeam: "Algeria",
    homeFormation: "4-2-3-1", awayFormation: "4-3-3",
    homeStartXI: [
      {id:1,name:"Gregor Kobel",number:1,position:"GK"},
      {id:2,name:"Denis Zakaria",number:6,position:"RB"},
      {id:3,name:"Nico Elvedi",number:4,position:"CB"},
      {id:4,name:"Manuel Akanji",number:5,position:"CB"},
      {id:5,name:"Ricardo Rodriguez",number:13,position:"LB"},
      {id:6,name:"Remo Freuler",number:8,position:"CM"},
      {id:7,name:"Granit Xhaka",number:10,position:"CM"},
      {id:8,name:"Dan Ndoye",number:11,position:"RW"},
      {id:9,name:"Johan Manzambi",number:9,position:"AM"},
      {id:10,name:"Rubén Vargas",number:17,position:"LW"},
      {id:11,name:"Breel Embolo",number:7,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Fabian Rieder",number:22,position:"MF"},
      {id:13,name:"Noah Okafor",number:19,position:"FW"},
      {id:14,name:"Zeki Amdouni",number:23,position:"FW"},
    ],
    awayStartXI: [
      {id:20,name:"Luca Zidane",number:23,position:"GK"},
      {id:21,name:"Rafik Belghali",number:17,position:"RB"},
      {id:22,name:"Aïssa Mandi",number:2,position:"CB"},
      {id:23,name:"Ramy Bensebaini",number:21,position:"CB"},
      {id:24,name:"Rayan Aït-Nouri",number:15,position:"LB"},
      {id:25,name:"Nabil Bentaleb",number:19,position:"DM"},
      {id:26,name:"Ramiz Zerrouki",number:6,position:"CM"},
      {id:27,name:"Farès Chaïbi",number:10,position:"CM"},
      {id:28,name:"Riyad Mahrez",number:7,position:"RF"},
      {id:29,name:"Ibrahim Maza",number:22,position:"CF"},
      {id:30,name:"Houssem Aouar",number:8,position:"LF"},
    ],
    awaySubs: [
      {id:31,name:"Amine Gouiri",number:9,position:"FW"},
      {id:32,name:"Anis Hadj Moussa",number:11,position:"FW"},
      {id:33,name:"Hicham Boudaoui",number:14,position:"MF"},
    ],
  },
  "Australia_Egypt": {
    homeTeam: "Australia", awayTeam: "Egypt",
    homeFormation: "3-4-3", awayFormation: "4-2-3-1",
    homeStartXI: [
      {id:1,name:"Patrick Beach",number:18,position:"GK"},
      {id:2,name:"Alessandro Circati",number:3,position:"CB"},
      {id:3,name:"Harry Souttar",number:19,position:"CB"},
      {id:4,name:"Lucas Herrington",number:25,position:"CB"},
      {id:5,name:"Jordan Bos",number:5,position:"RM"},
      {id:6,name:"Jackson Irvine",number:22,position:"CM"},
      {id:7,name:"Aiden O'Neill",number:13,position:"CM"},
      {id:8,name:"Aziz Behich",number:16,position:"LM"},
      {id:9,name:"Cristian Volpato",number:20,position:"RF"},
      {id:10,name:"Nestory Irankunda",number:17,position:"CF"},
      {id:11,name:"Connor Metcalfe",number:8,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Ajdin Hrustic",number:10,position:"FW"},
      {id:13,name:"Mohamed Touré",number:9,position:"FW"},
      {id:14,name:"Awer Mabil",number:11,position:"FW"},
      {id:15,name:"Mathew Ryan",number:1,position:"GK"},
    ],
    awayStartXI: [
      {id:20,name:"Mostafa Shobeir",number:23,position:"GK"},
      {id:21,name:"Mohamed Hany",number:3,position:"RB"},
      {id:22,name:"Yasser Ibrahim",number:2,position:"CB"},
      {id:23,name:"Ramy Rabia",number:5,position:"CB"},
      {id:24,name:"Karim Hafez",number:15,position:"LB"},
      {id:25,name:"Emam Ashour",number:8,position:"RM"},
      {id:26,name:"Hamdy Fathy",number:14,position:"CM"},
      {id:27,name:"Marwan Attia",number:19,position:"CM"},
      {id:28,name:"Mostafa Ziko",number:11,position:"LM"},
      {id:29,name:"Mohamed Salah",number:10,position:"CF"},
      {id:30,name:"Omar Marmoush",number:22,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Haissem Hassan",number:12,position:"FW"},
      {id:32,name:"Hossam Abdelmaguid",number:4,position:"DF"},
      {id:33,name:"Mahmoud Saber",number:21,position:"MF"},
    ],
  },
  "Argentina_Cape Verde": {
    homeTeam: "Argentina", awayTeam: "Cape Verde",
    homeFormation: "4-2-3-1", awayFormation: "4-5-1",
    homeStartXI: [
      {id:1,name:"Emiliano Martínez",number:23,position:"GK"},
      {id:2,name:"Nahuel Molina",number:26,position:"RB"},
      {id:3,name:"Cristian Romero",number:13,position:"CB"},
      {id:4,name:"Lisandro Martínez",number:6,position:"CB"},
      {id:5,name:"Facundo Medina",number:25,position:"LB"},
      {id:6,name:"Rodrigo De Paul",number:7,position:"RM"},
      {id:7,name:"Alexis Mac Allister",number:20,position:"CM"},
      {id:8,name:"Enzo Fernández",number:24,position:"CM"},
      {id:9,name:"Thiago Almada",number:16,position:"LM"},
      {id:10,name:"Lionel Messi",number:10,position:"CF"},
      {id:11,name:"Lautaro Martínez",number:22,position:"CF"},
    ],
    homeSubs: [
      {id:12,name:"Nico González",number:15,position:"MF"},
      {id:13,name:"Julián Alvarez",number:9,position:"FW"},
      {id:14,name:"Leandro Paredes",number:5,position:"MF"},
      {id:15,name:"Nicolás Tagliafico",number:3,position:"DF"},
      {id:16,name:"Gonzalo Montiel",number:4,position:"DF"},
    ],
    awayStartXI: [
      {id:20,name:"Vozinha",number:1,position:"GK"},
      {id:21,name:"Steven Moreira",number:22,position:"RB"},
      {id:22,name:"Pico",number:4,position:"CB"},
      {id:23,name:"Diney",number:3,position:"CB"},
      {id:24,name:"Sidny Lopes Cabral",number:13,position:"LB"},
      {id:25,name:"Kevin Pina",number:6,position:"DM"},
      {id:26,name:"Ryan Mendes",number:20,position:"RM"},
      {id:27,name:"Laros Duarte",number:15,position:"CM"},
      {id:28,name:"Deroy Duarte",number:14,position:"CM"},
      {id:29,name:"Jovane Cabral",number:7,position:"LM"},
      {id:30,name:"Nuno da Costa",number:21,position:"CF"},
    ],
    awaySubs: [
      {id:31,name:"Jamiro Monteiro",number:10,position:"MF"},
      {id:32,name:"Dailon Livramento",number:19,position:"FW"},
      {id:33,name:"Willy Semedo",number:17,position:"MF"},
    ],
  },
  "Colombia_Ghana": {
    homeTeam: "Colombia", awayTeam: "Ghana",
    homeFormation: "4-3-3", awayFormation: "4-5-1",
    homeStartXI: [
      {id:1,name:"Camilo Vargas",number:12,position:"GK"},
      {id:2,name:"Daniel Muñoz",number:2,position:"RB"},
      {id:3,name:"Davinson Sánchez",number:23,position:"CB"},
      {id:4,name:"Jhon Lucumí",number:3,position:"CB"},
      {id:5,name:"Johan Mojica",number:17,position:"LB"},
      {id:6,name:"Jefferson Lerma",number:16,position:"DM"},
      {id:7,name:"Gustavo Puerta",number:14,position:"CM"},
      {id:8,name:"Jhon Arias",number:11,position:"CM"},
      {id:9,name:"James Rodríguez",number:10,position:"RF"},
      {id:10,name:"Jhon Córdoba",number:9,position:"CF"},
      {id:11,name:"Luis Díaz",number:7,position:"LF"},
    ],
    homeSubs: [
      {id:12,name:"Luis Suárez",number:25,position:"FW"},
      {id:13,name:"Richard Ríos",number:6,position:"MF"},
      {id:14,name:"Juan Quintero",number:20,position:"MF"},
      {id:15,name:"Jaminton Campaz",number:21,position:"FW"},
    ],
    awayStartXI: [
      {id:20,name:"Lawrence Ati-Zigi",number:1,position:"GK"},
      {id:21,name:"Marvin Senaya",number:26,position:"RB"},
      {id:22,name:"Derrick Luckassen",number:23,position:"CB"},
      {id:23,name:"Jerome Opoku",number:18,position:"CB"},
      {id:24,name:"Gideon Mensah",number:14,position:"LB"},
      {id:25,name:"Thomas Partey",number:5,position:"DM"},
      {id:26,name:"Caleb Yirenkyi",number:3,position:"CM"},
      {id:27,name:"Kwasi Sibo",number:8,position:"CM"},
      {id:28,name:"Iñaki Williams",number:19,position:"RF"},
      {id:29,name:"Jordan Ayew",number:9,position:"CF"},
      {id:30,name:"Antoine Semenyo",number:11,position:"LF"},
    ],
    awaySubs: [
      {id:31,name:"Abdul Fatawu",number:7,position:"FW"},
      {id:32,name:"Elisha Owusu",number:15,position:"MF"},
      {id:33,name:"Ernest Nuamah",number:24,position:"FW"},
    ],
  },
};





export const HARDCODED_STATS: Record<string, MatchStatItem[]> = {
  "South Africa_Canada": [
    {type:"Ball Possession",home:"45%",away:"55%"},
    {type:"Total Shots",home:8,away:14},
    {type:"Shots on Target",home:2,away:5},
    {type:"Corners",home:3,away:6},
    {type:"Fouls",home:12,away:10},
    {type:"Yellow Cards",home:0,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Brazil_Japan": [
    {type:"Ball Possession",home:"62%",away:"38%"},
    {type:"Total Shots",home:18,away:7},
    {type:"Shots on Target",home:6,away:3},
    {type:"Corners",home:8,away:3},
    {type:"Fouls",home:11,away:13},
    {type:"Yellow Cards",home:2,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Germany_Paraguay": [
    {type:"Ball Possession",home:"58%",away:"42%"},
    {type:"Total Shots",home:19,away:9},
    {type:"Shots on Target",home:5,away:3},
    {type:"Corners",home:9,away:4},
    {type:"Fouls",home:14,away:16},
    {type:"Yellow Cards",home:1,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Netherlands_Morocco": [
    {type:"Ball Possession",home:"52%",away:"48%"},
    {type:"Total Shots",home:14,away:12},
    {type:"Shots on Target",home:4,away:4},
    {type:"Corners",home:7,away:5},
    {type:"Fouls",home:13,away:15},
    {type:"Yellow Cards",home:0,away:1},
    {type:"Red Cards",home:0,away:0},
  ],
  "Ivory Coast_Norway": [
    {type:"Ball Possession",home:"48%",away:"52%"},
    {type:"Total Shots",home:10,away:15},
    {type:"Shots on Target",home:3,away:6},
    {type:"Corners",home:4,away:7},
    {type:"Fouls",home:11,away:9},
    {type:"Yellow Cards",home:0,away:1},
    {type:"Red Cards",home:0,away:0},
  ],
  "France_Sweden": [
    {type:"Ball Possession",home:"64%",away:"36%"},
    {type:"Total Shots",home:22,away:6},
    {type:"Shots on Target",home:8,away:2},
    {type:"Corners",home:10,away:2},
    {type:"Fouls",home:9,away:14},
    {type:"Yellow Cards",home:0,away:0},
    {type:"Red Cards",home:0,away:0},
  ],
  "Mexico_Ecuador": [
    {type:"Ball Possession",home:"54%",away:"46%"},
    {type:"Total Shots",home:13,away:8},
    {type:"Shots on Target",home:5,away:2},
    {type:"Corners",home:6,away:3},
    {type:"Fouls",home:10,away:12},
    {type:"Yellow Cards",home:0,away:2},
    {type:"Red Cards",home:0,away:1},
  ],
  "England_D.R. Congo": [
    {type:"Ball Possession",home:"67%",away:"33%"},
    {type:"Total Shots",home:20,away:6},
    {type:"Shots on Target",home:7,away:4},
    {type:"Corners",home:9,away:2},
    {type:"Fouls",home:8,away:13},
    {type:"Yellow Cards",home:1,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Belgium_Senegal": [
    {type:"Ball Possession",home:"55%",away:"45%"},
    {type:"Total Shots",home:16,away:11},
    {type:"Shots on Target",home:5,away:5},
    {type:"Corners",home:7,away:4},
    {type:"Fouls",home:13,away:12},
    {type:"Yellow Cards",home:1,away:1},
    {type:"Red Cards",home:0,away:0},
  ],
  "USA_Bosnia & Herzegovina": [
    {type:"Ball Possession",home:"58%",away:"42%"},
    {type:"Total Shots",home:15,away:9},
    {type:"Shots on Target",home:6,away:3},
    {type:"Corners",home:6,away:4},
    {type:"Fouls",home:11,away:13},
    {type:"Yellow Cards",home:0,away:1},
    {type:"Red Cards",home:1,away:0},
  ],
  "Spain_Austria": [
    {type:"Ball Possession",home:"68%",away:"32%"},
    {type:"Total Shots",home:21,away:7},
    {type:"Shots on Target",home:8,away:2},
    {type:"Corners",home:11,away:3},
    {type:"Fouls",home:8,away:14},
    {type:"Yellow Cards",home:0,away:1},
    {type:"Red Cards",home:0,away:0},
  ],
  "Portugal_Croatia": [
    {type:"Ball Possession",home:"56%",away:"44%"},
    {type:"Total Shots",home:17,away:10},
    {type:"Shots on Target",home:6,away:4},
    {type:"Corners",home:8,away:5},
    {type:"Fouls",home:10,away:12},
    {type:"Yellow Cards",home:1,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Switzerland_Algeria": [
    {type:"Ball Possession",home:"55%",away:"45%"},
    {type:"Total Shots",home:14,away:9},
    {type:"Shots on Target",home:6,away:3},
    {type:"Corners",home:7,away:4},
    {type:"Fouls",home:10,away:13},
    {type:"Yellow Cards",home:0,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Australia_Egypt": [
    {type:"Ball Possession",home:"48%",away:"52%"},
    {type:"Total Shots",home:12,away:14},
    {type:"Shots on Target",home:4,away:5},
    {type:"Corners",home:5,away:6},
    {type:"Fouls",home:12,away:11},
    {type:"Yellow Cards",home:0,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Argentina_Cape Verde": [
    {type:"Ball Possession",home:"62%",away:"38%"},
    {type:"Total Shots",home:19,away:8},
    {type:"Shots on Target",home:7,away:4},
    {type:"Corners",home:9,away:3},
    {type:"Fouls",home:11,away:14},
    {type:"Yellow Cards",home:1,away:1},
    {type:"Red Cards",home:0,away:0},
  ],
  "Colombia_Ghana": [
    {type:"Ball Possession",home:"61%",away:"39%"},
    {type:"Total Shots",home:18,away:8},
    {type:"Shots on Target",home:7,away:0},
    {type:"Corners",home:8,away:3},
    {type:"Fouls",home:9,away:11},
    {type:"Yellow Cards",home:1,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  // Round of 16
  "Canada_Morocco": [
    {type:"Ball Possession",home:"45%",away:"55%"},
    {type:"Total Shots",home:8,away:5},
    {type:"Shots on Target",home:3,away:4},
    {type:"Corners",home:11,away:1},
    {type:"Fouls",home:24,away:14},
    {type:"Yellow Cards",home:4,away:4},
    {type:"Red Cards",home:0,away:0},
  ],
  "Paraguay_France": [
    {type:"Ball Possession",home:"24%",away:"76%"},
    {type:"Total Shots",home:5,away:18},
    {type:"Shots on Target",home:2,away:6},
    {type:"Corners",home:2,away:9},
    {type:"Fouls",home:16,away:10},
    {type:"Yellow Cards",home:1,away:0},
    {type:"Red Cards",home:0,away:0},
  ],
  "Brazil_Norway": [
    {type:"Ball Possession",home:"30%",away:"70%"},
    {type:"Total Shots",home:14,away:9},
    {type:"Shots on Target",home:4,away:5},
    {type:"Corners",home:5,away:6},
    {type:"Fouls",home:7,away:8},
    {type:"Yellow Cards",home:1,away:0},
    {type:"Red Cards",home:0,away:0},
  ],
  "Mexico_England": [
    {type:"Ball Possession",home:"61%",away:"39%"},
    {type:"Total Shots",home:20,away:4},
    {type:"Shots on Target",home:3,away:3},
    {type:"Corners",home:4,away:2},
    {type:"Fouls",home:9,away:4},
    {type:"Yellow Cards",home:0,away:1},
    {type:"Red Cards",home:0,away:1},
  ],
  "Portugal_Spain": [
    {type:"Ball Possession",home:"45%",away:"55%"},
    {type:"Total Shots",home:7,away:12},
    {type:"Shots on Target",home:2,away:6},
    {type:"Corners",home:3,away:7},
    {type:"Fouls",home:9,away:13},
    {type:"Yellow Cards",home:2,away:1},
    {type:"Red Cards",home:0,away:0},
  ],
  "USA_Belgium": [
    {type:"Ball Possession",home:"44%",away:"56%"},
    {type:"Total Shots",home:2,away:7},
    {type:"Shots on Target",home:2,away:7},
    {type:"Corners",home:3,away:5},
    {type:"Fouls",home:11,away:9},
    {type:"Yellow Cards",home:0,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Argentina_Egypt": [
    {type:"Ball Possession",home:"55%",away:"45%"},
    {type:"Total Shots",home:18,away:12},
    {type:"Shots on Target",home:7,away:5},
    {type:"Corners",home:7,away:5},
    {type:"Fouls",home:12,away:14},
    {type:"Yellow Cards",home:1,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
  "Switzerland_Colombia": [
    {type:"Ball Possession",home:"52%",away:"48%"},
    {type:"Total Shots",home:12,away:13},
    {type:"Shots on Target",home:4,away:4},
    {type:"Corners",home:6,away:5},
    {type:"Fouls",home:11,away:12},
    {type:"Yellow Cards",home:1,away:1},
    {type:"Red Cards",home:0,away:0},
  ],
};

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
