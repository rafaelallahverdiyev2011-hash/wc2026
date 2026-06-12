// API service for football data - supports both mock and live API modes

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Global mode flag - default to mock data
let useMockData = true;
let apiToken = null;

export function setDataMode(useMock) {
  useMockData = useMock;
}

export function getDataMode() {
  return useMockData;
}

export function setApiToken(token) {
  apiToken = token;
}

// Mock data generators
function generateMockLiveMatches() {
  const now = new Date();
  const baseMinute = Math.floor((now.getMinutes() % 90) + 15);

  return [
    {
      id: '1001',
      status: 'LIVE',
      minute: baseMinute,
      homeTeam: { name: 'France', flag: '🇫🇷', code: 'FRA' },
      awayTeam: { name: 'Spain', flag: '🇪🇸', code: 'ESP' },
      score: { home: 2, away: 1 },
      competition: 'Group A',
    },
    {
      id: '1002',
      status: 'LIVE',
      minute: Math.max(45, baseMinute - 22),
      homeTeam: { name: 'Brazil', flag: '🇧🇷', code: 'BRA' },
      awayTeam: { name: 'Argentina', flag: '🇦🇷', code: 'ARG' },
      score: { home: 1, away: 1 },
      competition: 'Group B',
    },
    {
      id: '1003',
      status: 'LIVE',
      minute: Math.min(90, baseMinute + 45),
      homeTeam: { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG' },
      awayTeam: { name: 'Netherlands', flag: '🇳🇱', code: 'NED' },
      score: { home: 3, away: 2 },
      competition: 'Group C',
    },
    {
      id: '1004',
      status: 'LIVE',
      minute: Math.min(45, baseMinute - 10),
      homeTeam: { name: 'Germany', flag: '🇩🇪', code: 'GER' },
      awayTeam: { name: 'Portugal', flag: '🇵🇹', code: 'POR' },
      score: { home: 0, away: 1 },
      competition: 'Group D',
    },
    {
      id: '1005',
      status: 'LIVE',
      minute: Math.min(90, baseMinute + 50),
      homeTeam: { name: 'Italy', flag: '🇮🇹', code: 'ITA' },
      awayTeam: { name: 'Denmark', flag: '🇩🇰', code: 'DEN' },
      score: { home: 2, away: 0 },
      competition: 'Group E',
    },
  ];
}

function generateMockStandings() {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const standings = {};

  groups.forEach((group) => {
    standings[group] = [
      {
        position: 1,
        team: { name: getRandomTeam(), flag: '🇫🇷', code: 'FRA' },
        played: 3,
        won: 2,
        drawn: 1,
        lost: 0,
        goalsFor: 7,
        goalsAgainst: 2,
        goalDifference: 5,
        points: 7,
        form: ['W', 'W', 'D'],
      },
      {
        position: 2,
        team: { name: getRandomTeam(), flag: '🇪🇸', code: 'ESP' },
        played: 3,
        won: 2,
        drawn: 0,
        lost: 1,
        goalsFor: 5,
        goalsAgainst: 3,
        goalDifference: 2,
        points: 6,
        form: ['W', 'L', 'W'],
      },
      {
        position: 3,
        team: { name: getRandomTeam(), flag: '🇧🇷', code: 'BRA' },
        played: 3,
        won: 1,
        drawn: 1,
        lost: 1,
        goalsFor: 4,
        goalsAgainst: 4,
        goalDifference: 0,
        points: 4,
        form: ['D', 'W', 'L'],
      },
      {
        position: 4,
        team: { name: getRandomTeam(), flag: '🇦🇷', code: 'ARG' },
        played: 3,
        won: 0,
        drawn: 0,
        lost: 3,
        goalsFor: 1,
        goalsAgainst: 8,
        goalDifference: -7,
        points: 0,
        form: ['L', 'L', 'L'],
      },
    ];
  });

  return standings;
}

function generateMockSchedule() {
  const now = new Date();
  const schedule = [];
  const teams = [
    ['USA', 'Canada'],
    ['Japan', 'Australia'],
    ['Morocco', 'Croatia'],
    ['Switzerland', 'Wales'],
    ['Senegal', 'Ecuador'],
    ['Poland', 'Mexico'],
  ];

  for (let i = 0; i < teams.length; i++) {
    const matchDate = new Date(now);
    matchDate.setDate(now.getDate() + i);
    const hours = 14 + (i % 4) * 3;
    matchDate.setHours(hours, 0, 0, 0);

    schedule.push({
      id: (2000 + i).toString(),
      status: 'SCHEDULED',
      date: matchDate.toISOString(),
      homeTeam: { name: teams[i][0], flag: '⚽', code: teams[i][0].slice(0, 3).toUpperCase() },
      awayTeam: { name: teams[i][1], flag: '⚽', code: teams[i][1].slice(0, 3).toUpperCase() },
      competition: `Group ${String.fromCharCode(65 + (i % 8))}`,
    });
  }

  return schedule;
}

function getRandomTeam() {
  const teams = ['France', 'Spain', 'Brazil', 'Argentina', 'England', 'Netherlands', 'Germany', 'Portugal'];
  return teams[Math.floor(Math.random() * teams.length)];
}

// API call helper
async function apiCall(endpoint) {
  // If we have a token, use football-data.org directly with X-Auth-Token
  if (apiToken) {
    const response = await fetch(
      `https://api.football-data.org/v4/${endpoint}`,
      {
        headers: {
          'X-Auth-Token': apiToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Otherwise use Supabase Edge Function proxy
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/football-proxy?${endpoint}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `API request failed: ${response.statusText}`);
  }

  return await response.json();
}

// Main API functions
export async function getLiveMatches() {
  if (useMockData) {
    return generateMockLiveMatches();
  }

  // Real API: GET /matches?status=LIVE
  const data = await apiCall('matches?status=LIVE');
  // Transform football-data.org format to our format
  if (apiToken) {
    return (data.matches || []).map(match => ({
      id: match.id.toString(),
      status: match.status === 'IN_PLAY' || match.status === 'LIVE' ? 'LIVE' : match.status,
      minute: match.minute || 0,
      homeTeam: {
        name: match.homeTeam.name,
        flag: getCountryFlag(match.homeTeam.tla),
        code: match.homeTeam.tla,
      },
      awayTeam: {
        name: match.awayTeam.name,
        flag: getCountryFlag(match.awayTeam.tla),
        code: match.awayTeam.tla,
      },
      score: {
        home: match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0,
        away: match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0,
      },
      competition: match.competition?.name || 'World Cup',
    }));
  }
  return data.response || [];
}

export async function getStandings() {
  if (useMockData) {
    return generateMockStandings();
  }

  // Real API: GET /competitions/WC/standings
  const data = await apiCall('competitions/WC/standings');
  if (apiToken) {
    // Transform football-data.org format to our format
    const standings = {};
    (data.standings || []).forEach(standing => {
      const group = standing.group?.replace('Group ', '') || 'A';
      standings[group] = standing.table.map((entry, idx) => ({
        position: entry.position,
        team: {
          name: entry.team.name,
          flag: getCountryFlag(entry.team.tla),
          code: entry.team.tla,
        },
        played: entry.playedGames,
        won: entry.won,
        drawn: entry.draw,
        lost: entry.lost,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference: entry.goalDifference,
        points: entry.points,
        form: entry.form?.split(',') || [],
      }));
    });
    return standings;
  }
  return data.response || [];
}

export async function getSchedule() {
  if (useMockData) {
    return generateMockSchedule();
  }

  // Real API: GET /competitions/WC/matches
  const data = await apiCall('competitions/WC/matches');
  if (apiToken) {
    return (data.matches || []).map(match => ({
      id: match.id.toString(),
      status: match.status,
      date: match.utcDate,
      homeTeam: {
        name: match.homeTeam.name,
        flag: getCountryFlag(match.homeTeam.tla),
        code: match.homeTeam.tla,
      },
      awayTeam: {
        name: match.awayTeam.name,
        flag: getCountryFlag(match.awayTeam.tla),
        code: match.awayTeam.tla,
      },
      competition: match.competition?.name || 'World Cup',
    }));
  }
  return data.response || [];
}

// Helper to get flag emoji from country code
function getCountryFlag(code) {
  const flags = {
    'FRA': '🇫🇷',
    'ESP': '🇪🇸',
    'BRA': '🇧🇷',
    'ARG': '🇦🇷',
    'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'NED': '🇳🇱',
    'GER': '🇩🇪',
    'POR': '🇵🇹',
    'ITA': '🇮🇹',
    'DEN': '🇩🇰',
    'USA': '🇺🇸',
    'CAN': '🇨🇦',
    'JPN': '🇯🇵',
    'AUS': '🇦🇺',
    'MAR': '🇲🇦',
    'CRO': '🇭🇷',
    'SUI': '🇨🇭',
    'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  };
  return flags[code] || '⚽';
}
