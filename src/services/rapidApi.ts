// Shared service for the Free API Live Football Data (RapidAPI)
// In dev: requests go through the Vite dev proxy at /api/proxy?endpoint=...
// In production: requests go through the Supabase Edge Function

export const WC_LEAGUE_ID = 17;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function getProxyUrl(endpoint: string): string {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    return `/api/proxy?endpoint=${encodeURIComponent(endpoint)}`;
  }
  // Production: use Supabase Edge Function
  return `${SUPABASE_URL}/functions/v1/football-proxy?endpoint=${encodeURIComponent(endpoint)}`;
}

async function fetchProxy<T>(endpoint: string): Promise<T> {
  const url = getProxyUrl(endpoint);
  const isDev = import.meta.env.DEV;
  const headers: Record<string, string> = {};
  if (!isDev) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    headers['apikey'] = SUPABASE_ANON_KEY;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface LiveTeam {
  id: number;
  name: string;
  score: number | null;
}

export interface LiveMatch {
  id: number;
  homeTeam: LiveTeam;
  awayTeam: LiveTeam;
  minute: number | null;
  status: string; // e.g. "1H", "2H", "HT", "FT", "NS"
}

export interface StandingRow {
  position: number;
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  groupName: string;
}

export interface BracketMatch {
  id: number;
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  stage: string;
  minute: number | null;
}

export interface ScheduledMatch {
  id: number;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  kickoff: string; // ISO date string
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  stage: string;
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function fetchLiveMatches(): Promise<LiveMatch[]> {
  try {
    const data: any = await fetchProxy('football-current-live');
    const matches: any[] = data?.response ?? data?.matches ?? data?.data ?? [];
    return matches.map((m: any) => ({
      id: m.fixture?.id ?? m.id,
      homeTeam: {
        id: m.teams?.home?.id ?? m.homeTeam?.id ?? 0,
        name: m.teams?.home?.name ?? m.homeTeam?.name ?? '',
        score: m.goals?.home ?? m.score?.home ?? null,
      },
      awayTeam: {
        id: m.teams?.away?.id ?? m.awayTeam?.id ?? 0,
        name: m.teams?.away?.name ?? m.awayTeam?.name ?? '',
        score: m.goals?.away ?? m.score?.away ?? null,
      },
      minute: m.fixture?.status?.elapsed ?? m.minute ?? null,
      status: m.fixture?.status?.short ?? m.status ?? 'NS',
    }));
  } catch {
    return [];
  }
}

export async function fetchStandings(): Promise<StandingRow[]> {
  try {
    const data: any = await fetchProxy(`football-get-standing-all-by-league?leagueid=${WC_LEAGUE_ID}`);
    const groups: any[] = data?.response ?? data?.standings ?? data?.data ?? [];
    const rows: StandingRow[] = [];

    for (const group of groups) {
      const standings: any[] = Array.isArray(group) ? group : (group?.standings ?? group?.teams ?? []);
      const groupName: string = group?.group ?? group?.name ?? '';

      for (const entry of standings) {
        const team = entry?.team ?? entry;
        const all = entry?.all ?? entry;
        rows.push({
          position: entry?.rank ?? entry?.position ?? 0,
          teamId: team?.id ?? entry?.teamId ?? 0,
          teamName: team?.name ?? entry?.teamName ?? entry?.name ?? '',
          played: all?.played ?? entry?.played ?? entry?.matchesPlayed ?? 0,
          won: all?.win ?? entry?.won ?? entry?.wins ?? 0,
          drawn: all?.draw ?? entry?.drawn ?? entry?.draws ?? 0,
          lost: all?.lose ?? entry?.lost ?? entry?.losses ?? 0,
          goalsFor: all?.goals?.for ?? entry?.goalsFor ?? entry?.gf ?? 0,
          goalsAgainst: all?.goals?.against ?? entry?.goalsAgainst ?? entry?.ga ?? 0,
          goalDiff: entry?.goalsDiff ?? entry?.gd ?? ((all?.goals?.for ?? 0) - (all?.goals?.against ?? 0)),
          points: entry?.points ?? entry?.pts ?? 0,
          groupName,
        });
      }
    }
    return rows;
  } catch {
    return [];
  }
}

export async function fetchLeagueMatches(): Promise<ScheduledMatch[]> {
  try {
    const data: any = await fetchProxy(`football-get-matches-by-league?leagueid=${WC_LEAGUE_ID}`);
    const matches: any[] = data?.response ?? data?.matches ?? data?.data ?? [];
    return matches.map((m: any) => ({
      id: m.fixture?.id ?? m.id,
      homeTeamId: m.teams?.home?.id ?? m.homeTeam?.id ?? 0,
      homeTeamName: m.teams?.home?.name ?? m.homeTeam?.name ?? '',
      awayTeamId: m.teams?.away?.id ?? m.awayTeam?.id ?? 0,
      awayTeamName: m.teams?.away?.name ?? m.awayTeam?.name ?? '',
      kickoff: m.fixture?.date ?? m.date ?? m.kickoff ?? '',
      status: m.fixture?.status?.short ?? m.status ?? 'NS',
      homeScore: m.goals?.home ?? m.score?.home ?? null,
      awayScore: m.goals?.away ?? m.score?.away ?? null,
      stage: m.league?.round ?? m.stage ?? m.round ?? '',
      minute: m.fixture?.status?.elapsed ?? m.minute ?? null,
    }));
  } catch {
    return [];
  }
}
