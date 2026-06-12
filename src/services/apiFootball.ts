import { generateMockLiveMatches, generateMockUpcomingMatches } from '../data/mockData';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ApiMatch {
  fixture: {
    id: number;
    status: string;
    elapsed: number;
    date: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
}

export interface ApiMatchResponse {
  response: ApiMatch[];
}

let useMockData = true; // Default to mock data

export function setDataMode(useMock: boolean) {
  useMockData = useMock;
}

export function getDataMode(): boolean {
  return useMockData;
}

export async function fetchLiveMatches(): Promise<ApiMatch[]> {
  // Use mock data if enabled
  if (useMockData) {
    return generateMockLiveMatches();
  }

  // Real API call
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/football-proxy?endpoint=fixtures&live=all`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch live matches');
  }

  const data: ApiMatchResponse = await response.json();
  return data.response || [];
}

export async function fetchWorldCupMatches(): Promise<ApiMatch[]> {
  // Use mock data if enabled
  if (useMockData) {
    return generateMockUpcomingMatches();
  }

  // World Cup 2026 league ID (you may need to adjust this based on actual API)
  const WORLD_CUP_2026_LEAGUE_ID = 987;

  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  const fromDate = now.toISOString().split('T')[0];
  const toDate = futureDate.toISOString().split('T')[0];

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/football-proxy?endpoint=fixtures&league=${WORLD_CUP_2026_LEAGUE_ID}&season=2026&from=${fromDate}&to=${toDate}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch World Cup matches');
  }

  const data: ApiMatchResponse = await response.json();
  return data.response || [];
}

export function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    France: '🇫🇷',
    Spain: '🇪🇸',
    Brazil: '🇧🇷',
    Argentina: '🇦🇷',
    England: '🇬🇧',
    Germany: '🇩🇪',
    Portugal: '🇵🇹',
    Netherlands: '🇳🇱',
    Italy: '🇮🇹',
    Mexico: '🇲🇽',
    USA: '🇺🇸',
    Japan: '🇯🇵',
    Morocco: '🇲🇦',
    Australia: '🇦🇺',
    Croatia: '🇭🇷',
    Switzerland: '🇨🇭',
    Denmark: '🇩🇰',
    Uruguay: '🇺🇾',
    Belgium: '🇧🇪',
    Canada: '🇨🇦',
  };

  return flags[countryCode] || '⚽';
}

export function calculateMatchProbabilities(
  status: string,
  elapsed: number,
  homeScore: number | null,
  awayScore: number | null
): { winTeam1: number; winTeam2: number; draw: number } {
  const score1 = homeScore || 0;
  const score2 = awayScore || 0;

  // Base probabilities based on current score
  const goalDiff = score1 - score2;

  // If match hasn't started
  if (status === 'NS') {
    return { winTeam1: 33, winTeam2: 33, draw: 34 };
  }

  // If match is live, adjust based on score and time
  const progress = Math.min(elapsed / 90, 0.95); // Cap at 95% to account for stoppage time

  // Simple probability model - higher scoring team has advantage
  // More time elapsed = less uncertainty
  const uncertainty = 1 - progress;

  let winTeam1 = 33;
  let winTeam2 = 33;
  let draw = 34;

  if (goalDiff > 0) {
    // Team 1 is winning
    const advantage = Math.min(goalDiff * 20, 60);
    winTeam1 = 33 + advantage - (uncertainty * 20);
    winTeam2 = Math.max(33 - advantage, 10);
    draw = 100 - winTeam1 - winTeam2;
  } else if (goalDiff < 0) {
    // Team 2 is winning
    const advantage = Math.min(Math.abs(goalDiff) * 20, 60);
    winTeam2 = 33 + advantage - (uncertainty * 20);
    winTeam1 = Math.max(33 - advantage, 10);
    draw = 100 - winTeam1 - winTeam2;
  } else {
    // Draw
    draw = 50 - (progress * 20);
    winTeam1 = 25 + (uncertainty * 15);
    winTeam2 = 25 + (uncertainty * 15);
  }

  // Normalize
  const total = winTeam1 + winTeam2 + draw;
  return {
    winTeam1: Math.round((winTeam1 / total) * 100),
    winTeam2: Math.round((winTeam2 / total) * 100),
    draw: Math.round((draw / total) * 100),
  };
}
