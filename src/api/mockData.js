// Consolidated mock data for World Cup 2026

export const teams = {
  france: { name: 'France', flag: '🇫🇷', code: 'FRA', probability: 18.4 },
  spain: { name: 'Spain', flag: '🇪🇸', code: 'ESP', probability: 12.7 },
  brazil: { name: 'Brazil', flag: '🇧🇷', code: 'BRA', probability: 15.3 },
  argentina: { name: 'Argentina', flag: '🇦🇷', code: 'ARG', probability: 14.2 },
  england: { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG', probability: 11.8 },
  netherlands: { name: 'Netherlands', flag: '🇳🇱', code: 'NED', probability: 8.9 },
  germany: { name: 'Germany', flag: '🇩🇪', code: 'GER', probability: 10.5 },
  portugal: { name: 'Portugal', flag: '🇵🇹', code: 'POR', probability: 9.4 },
  italy: { name: 'Italy', flag: '🇮🇹', code: 'ITA' },
  denmark: { name: 'Denmark', flag: '🇩🇰', code: 'DEN' },
  usa: { name: 'USA', flag: '🇺🇸', code: 'USA' },
  canada: { name: 'Canada', flag: '🇨🇦', code: 'CAN' },
  japan: { name: 'Japan', flag: '🇯🇵', code: 'JPN' },
  australia: { name: 'Australia', flag: '🇦🇺', code: 'AUS' },
  morocco: { name: 'Morocco', flag: '🇲🇦', code: 'MAR' },
  croatia: { name: 'Croatia', flag: '🇭🇷', code: 'CRO' },
  switzerland: { name: 'Switzerland', flag: '🇨🇭', code: 'SUI' },
  wales: { name: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', code: 'WAL' },
};

// Live matches for the Live tab
export const liveMatches = [
  {
    id: '1001',
    status: 'LIVE',
    minute: 67,
    homeTeam: teams.france,
    awayTeam: teams.spain,
    score: { home: 2, away: 1 },
    competition: 'Group A',
  },
  {
    id: '1002',
    status: 'LIVE',
    minute: 45,
    homeTeam: teams.brazil,
    awayTeam: teams.argentina,
    score: { home: 1, away: 1 },
    competition: 'Group B',
  },
  {
    id: '1003',
    status: 'LIVE',
    minute: 78,
    homeTeam: teams.england,
    awayTeam: teams.netherlands,
    score: { home: 3, away: 2 },
    competition: 'Group C',
  },
];

// Upcoming matches
export const upcomingMatches = [
  {
    id: '2001',
    status: 'SCHEDULED',
    kickoff: '14:00',
    homeTeam: teams.usa,
    awayTeam: teams.canada,
  },
  {
    id: '2002',
    status: 'SCHEDULED',
    kickoff: '17:00',
    homeTeam: teams.japan,
    awayTeam: teams.australia,
  },
];

// Group standings
export const groupStandings = {
  A: [
    { position: 1, team: teams.france, played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 7, goalsAgainst: 2, goalDifference: 5, points: 7, form: ['W', 'W', 'D'] },
    { position: 2, team: teams.spain, played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference: 2, points: 6, form: ['W', 'L', 'W'] },
    { position: 3, team: teams.brazil, played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0, points: 4, form: ['D', 'W', 'L'] },
    { position: 4, team: teams.argentina, played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 8, goalDifference: -7, points: 0, form: ['L', 'L', 'L'] },
  ],
  B: [
    { position: 1, team: teams.england, played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 8, goalsAgainst: 1, goalDifference: 7, points: 9, form: ['W', 'W', 'W'] },
    { position: 2, team: teams.netherlands, played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 6, goalsAgainst: 3, goalDifference: 3, points: 6, form: ['W', 'L', 'W'] },
    { position: 3, team: teams.germany, played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0, points: 4, form: ['D', 'L', 'W'] },
    { position: 4, team: teams.portugal, played: 3, won: 0, drawn: 1, lost: 2, goalsFor: 2, goalsAgainst: 7, goalDifference: -5, points: 1, form: ['L', 'D', 'L'] },
  ],
};

// Knockout bracket predictions
export const knockoutMatchups = {
  roundOf16: [
    { team1: teams.france, team2: teams.portugal, winTeam1: 72, winTeam2: 28, status: 'UPCOMING' },
    { team1: teams.england, team2: teams.argentina, winTeam1: 58, winTeam2: 42, status: 'UPCOMING' },
    { team1: teams.brazil, team2: teams.netherlands, winTeam1: 65, winTeam2: 35, status: 'UPCOMING' },
    { team1: teams.spain, team2: teams.germany, winTeam1: 52, winTeam2: 48, status: 'UPCOMING' },
  ],
  quarterFinals: [
    { team1: teams.france, team2: teams.england, winTeam1: 55, winTeam2: 45, status: 'UPCOMING' },
    { team1: teams.brazil, team2: teams.spain, winTeam1: 60, winTeam2: 40, status: 'UPCOMING' },
  ],
  semiFinals: [
    { team1: teams.france, team2: teams.brazil, winTeam1: 50, winTeam2: 50, status: 'UPCOMING' },
  ],
  final: [
    { team1: teams.france, team2: teams.brazil, winTeam1: 50, winTeam2: 50, status: 'UPCOMING' },
  ],
};
