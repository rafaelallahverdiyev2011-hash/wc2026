// API service for World Cup 2026 - RapidAPI

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'world-cup-2026-live-api.p.rapidapi.com';

let useMockData = !RAPIDAPI_KEY;

export function setDataMode(useMock) {
  useMockData = useMock;
}

export function getDataMode() {
  return useMockData;
}

export function setApiToken(token) {
  // не используется, оставлено для совместимости
}

async function apiCall(endpoint) {
  const response = await fetch(
    `https://${RAPIDAPI_HOST}/wc/${endpoint}`,
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) throw new Error(`API error: ${response.statusText}`);
  return await response.json();
}

export async function getLiveMatches() {
  if (useMockData) return generateMockLiveMatches();
  try {
    const data = await apiCall('live');
    return (data || []).map(match => ({
      id: match.id?.toString(),
      status: 'LIVE',
      minute: match.minute || 0,
      homeTeam: {
        name: match.homeTeam?.name,
        flag: getCountryFlag(match.homeTeam?.code),
        code: match.homeTeam?.code,
      },
      awayTeam: {
        name: match.awayTeam?.name,
        flag: getCountryFlag(match.awayTeam?.code),
        code: match.awayTeam?.code,
      },
      score: {
        home: match.homeScore ?? 0,
        away: match.awayScore ?? 0,
      },
      competition: match.group || 'World Cup',
    }));
  } catch (e) {
    console.error(e);
    return generateMockLiveMatches();
  }
}

export async function getStandings() {
  if (useMockData) return generateMockStandings();
  try {
    const data = await apiCall('standings');
    const standings = {};
    (data || []).forEach(group => {
      const letter = group.group?.replace('Group ', '') || 'A';
      standings[letter] = (group.standings || []).map(entry => ({
        position: entry.position,
        team: {
          name: entry.team?.name,
          flag: getCountryFlag(entry.team?.code),
          code: entry.team?.code,
        },
        played: entry.played,
        won: entry.won,
        drawn: entry.drawn,
        lost: entry.lost,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference: entry.goalDifference,
        points: entry.points,
        form: [],
      }));
    });
    return standings;
  } catch (e) {
    console.error(e);
    return generateMockStandings();
  }
}

export async function getSchedule() {
  if (useMockData) return generateMockSchedule();
  try {
    const data = await apiCall('matches');
    return (data || []).map(match => ({
      id: match.id?.toString(),
      status: match.status || 'SCHEDULED',
      date: match.date,
      homeTeam: {
        name: match.homeTeam?.name,
        flag: getCountryFlag(match.homeTeam?.code),
        code: match.homeTeam?.code,
      },
      awayTeam: {
        name: match.awayTeam?.name,
        flag: getCountryFlag(match.awayTeam?.code),
        code: match.awayTeam?.code,
      },
      competition: match.group || 'World Cup',
    }));
  } catch (e) {
    console.error(e);
    return generateMockSchedule();
  }
}

function getCountryFlag(code) {
  const flags = {
    'FRA':'🇫🇷','ESP':'🇪🇸','BRA':'🇧🇷','ARG':'🇦🇷','ENG':'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'NED':'🇳🇱','GER':'🇩🇪','POR':'🇵🇹','ITA':'🇮🇹','DEN':'🇩🇰',
    'USA':'🇺🇸','CAN':'🇨🇦','JPN':'🇯🇵','AUS':'🇦🇺','MAR':'🇲🇦',
    'CRO':'🇭🇷','SUI':'🇨🇭','MEX':'🇲🇽','RSA':'🇿🇦','KOR':'🇰🇷',
    'CZE':'🇨🇿','WAL':'🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  };
  return flags[code] || '⚽';
}

// Mock fallbacks
function generateMockLiveMatches() {
  return [];
}
function generateMockStandings() {
  return {};
}
function generateMockSchedule() {
  return [];
}
