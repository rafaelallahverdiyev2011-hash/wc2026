export interface Team {
  name: string;
  flag: string;
  probability?: number;
}

export interface Group {
  id: string;
  teams: (Team & { probability: number })[];
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  score1?: number;
  score2?: number;
  minute?: number;
  winTeam1: number;
  winTeam2: number;
  draw?: number;
  kickoff?: string;
  status?: 'live' | 'upcoming' | 'finished';
}

export interface Matchup {
  team1: Team;
  team2: Team;
  winTeam1: number;
  winTeam2: number;
}

// Mock API Match format (mimics real API response)
export interface MockApiMatch {
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

// Dynamically generated live matches (simulates real-time)
export function generateMockLiveMatches(): MockApiMatch[] {
  const now = new Date();
  const baseMinute = Math.floor((now.getMinutes() % 90) + 15); // Varies 15-90 minutes

  return [
    {
      fixture: {
        id: 1001,
        status: '1H',
        elapsed: baseMinute,
        date: now.toISOString(),
      },
      teams: {
        home: {
          id: 1,
          name: 'France',
          logo: 'https://media.api-sports.io/flags/fr.svg',
          winner: null,
        },
        away: {
          id: 2,
          name: 'Spain',
          logo: 'https://media.api-sports.io/flags/es.svg',
          winner: null,
        },
      },
      goals: {
        home: 2,
        away: 1,
      },
      league: {
        id: 987,
        name: 'World Cup 2026',
        country: 'World',
      },
    },
    {
      fixture: {
        id: 1002,
        status: '1H',
        elapsed: Math.max(45, baseMinute - 22),
        date: now.toISOString(),
      },
      teams: {
        home: {
          id: 3,
          name: 'Brazil',
          logo: 'https://media.api-sports.io/flags/br.svg',
          winner: null,
        },
        away: {
          id: 4,
          name: 'Argentina',
          logo: 'https://media.api-sports.io/flags/ar.svg',
          winner: null,
        },
      },
      goals: {
        home: 1,
        away: 1,
      },
      league: {
        id: 987,
        name: 'World Cup 2026',
        country: 'World',
      },
    },
    {
      fixture: {
        id: 1003,
        status: '2H',
        elapsed: Math.min(90, baseMinute + 45),
        date: now.toISOString(),
      },
      teams: {
        home: {
          id: 5,
          name: 'England',
          logo: 'https://media.api-sports.io/flags/gb-eng.svg',
          winner: null,
        },
        away: {
          id: 6,
          name: 'Netherlands',
          logo: 'https://media.api-sports.io/flags/nl.svg',
          winner: null,
        },
      },
      goals: {
        home: 3,
        away: 2,
      },
      league: {
        id: 987,
        name: 'World Cup 2026',
        country: 'World',
      },
    },
    {
      fixture: {
        id: 1004,
        status: '1H',
        elapsed: Math.min(45, baseMinute - 10),
        date: now.toISOString(),
      },
      teams: {
        home: {
          id: 7,
          name: 'Germany',
          logo: 'https://media.api-sports.io/flags/de.svg',
          winner: null,
        },
        away: {
          id: 8,
          name: 'Portugal',
          logo: 'https://media.api-sports.io/flags/pt.svg',
          winner: null,
        },
      },
      goals: {
        home: 0,
        away: 1,
      },
      league: {
        id: 987,
        name: 'World Cup 2026',
        country: 'World',
      },
    },
    {
      fixture: {
        id: 1005,
        status: '2H',
        elapsed: Math.min(90, baseMinute + 50),
        date: now.toISOString(),
      },
      teams: {
        home: {
          id: 9,
          name: 'Italy',
          logo: 'https://media.api-sports.io/flags/it.svg',
          winner: null,
        },
        away: {
          id: 10,
          name: 'Denmark',
          logo: 'https://media.api-sports.io/flags/dk.svg',
          winner: null,
        },
      },
      goals: {
        home: 2,
        away: 0,
      },
      league: {
        id: 987,
        name: 'World Cup 2026',
        country: 'World',
      },
    },
  ];
}

// Upcoming matches
export function generateMockUpcomingMatches(): MockApiMatch[] {
  const now = new Date();
  const matches: MockApiMatch[] = [];
  const times = ['14:00', '17:00', '20:00', '23:00'];
  const teams = [
    ['USA', 'Canada'],
    ['Japan', 'Australia'],
    ['Morocco', 'Croatia'],
    ['Switzerland', 'Wales'],
  ];

  for (let i = 0; i < times.length; i++) {
    const hours = parseInt(times[i].split(':')[0]);
    const matchDate = new Date(now);
    matchDate.setHours(hours, 0, 0, 0);

    matches.push({
      fixture: {
        id: 2000 + i,
        status: 'NS',
        elapsed: 0,
        date: matchDate.toISOString(),
      },
      teams: {
        home: {
          id: 100 + i * 2,
          name: teams[i][0],
          logo: `https://media.api-sports.io/flags/${teams[i][0].toLowerCase().slice(0, 2)}.svg`,
          winner: null,
        },
        away: {
          id: 101 + i * 2,
          name: teams[i][1],
          logo: `https://media.api-sports.io/flags/${teams[i][1].toLowerCase().slice(0, 2)}.svg`,
          winner: null,
        },
      },
      goals: {
        home: null,
        away: null,
      },
      league: {
        id: 987,
        name: 'World Cup 2026',
        country: 'World',
      },
    });
  }

  return matches;
}

export const groupsData: Group[] = [
  {
    id: 'A',
    teams: [
      { name: 'Mexico',       flag: '🇲🇽', probability: 78 },
      { name: 'South Africa', flag: '🇿🇦', probability: 55 },
      { name: 'South Korea',  flag: '🇰🇷', probability: 62 },
      { name: 'Czechia',      flag: '🇨🇿', probability: 60 },
    ],
  },
  {
    id: 'B',
    teams: [
      { name: 'Canada',               flag: '🇨🇦', probability: 72 },
      { name: 'Bosnia & Herzegovina', flag: '🇧🇦', probability: 58 },
      { name: 'Qatar',                flag: '🇶🇦', probability: 40 },
      { name: 'Switzerland',          flag: '🇨🇭', probability: 65 },
    ],
  },
  {
    id: 'C',
    teams: [
      { name: 'Brazil',   flag: '🇧🇷', probability: 94 },
      { name: 'Morocco',  flag: '🇲🇦', probability: 70 },
      { name: 'Haiti',    flag: '🇭🇹', probability: 28 },
      { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', probability: 55 },
    ],
  },
  {
    id: 'D',
    teams: [
      { name: 'USA',       flag: '🇺🇸', probability: 80 },
      { name: 'Paraguay',  flag: '🇵🇾', probability: 56 },
      { name: 'Australia', flag: '🇦🇺', probability: 60 },
      { name: 'Turkey',    flag: '🇹🇷', probability: 64 },
    ],
  },
  {
    id: 'E',
    teams: [
      { name: 'Germany',     flag: '🇩🇪', probability: 87 },
      { name: 'Curaçao',     flag: '🇨🇼', probability: 22 },
      { name: 'Ivory Coast', flag: '🇨🇮', probability: 58 },
      { name: 'Ecuador',     flag: '🇪🇨', probability: 55 },
    ],
  },
  {
    id: 'F',
    teams: [
      { name: 'Netherlands', flag: '🇳🇱', probability: 85 },
      { name: 'Japan',       flag: '🇯🇵', probability: 70 },
      { name: 'Sweden',      flag: '🇸🇪', probability: 66 },
      { name: 'Tunisia',     flag: '🇹🇳', probability: 42 },
    ],
  },
  {
    id: 'G',
    teams: [
      { name: 'Belgium',     flag: '🇧🇪', probability: 82 },
      { name: 'Egypt',       flag: '🇪🇬', probability: 55 },
      { name: 'Iran',        flag: '🇮🇷', probability: 52 },
      { name: 'New Zealand', flag: '🇳🇿', probability: 38 },
    ],
  },
  {
    id: 'H',
    teams: [
      { name: 'Spain',        flag: '🇪🇸', probability: 90 },
      { name: 'Cape Verde',   flag: '🇨🇻', probability: 35 },
      { name: 'Saudi Arabia', flag: '🇸🇦', probability: 48 },
      { name: 'Uruguay',      flag: '🇺🇾', probability: 72 },
    ],
  },
  {
    id: 'I',
    teams: [
      { name: 'France',  flag: '🇫🇷', probability: 92 },
      { name: 'Senegal', flag: '🇸🇳', probability: 68 },
      { name: 'Iraq',    flag: '🇮🇶', probability: 30 },
      { name: 'Norway',  flag: '🇳🇴', probability: 62 },
    ],
  },
  {
    id: 'J',
    teams: [
      { name: 'Argentina', flag: '🇦🇷', probability: 91 },
      { name: 'Algeria',   flag: '🇩🇿', probability: 52 },
      { name: 'Austria',   flag: '🇦🇹', probability: 60 },
      { name: 'Jordan',    flag: '🇯🇴', probability: 28 },
    ],
  },
  {
    id: 'K',
    teams: [
      { name: 'Portugal',   flag: '🇵🇹', probability: 88 },
      { name: 'DR Congo',   flag: '🇨🇩', probability: 44 },
      { name: 'Uzbekistan', flag: '🇺🇿', probability: 38 },
      { name: 'Colombia',   flag: '🇨🇴', probability: 72 },
    ],
  },
  {
    id: 'L',
    teams: [
      { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', probability: 89 },
      { name: 'Croatia', flag: '🇭🇷', probability: 70 },
      { name: 'Ghana',   flag: '🇬🇭', probability: 48 },
      { name: 'Panama',  flag: '🇵🇦', probability: 38 },
    ],
  },
];

export const liveMatches: Match[] = [
  {
    id: '1',
    team1: { name: 'Франция', flag: '🇫🇷' },
    team2: { name: 'Испания', flag: '🇪🇸' },
    score1: 2,
    score2: 1,
    minute: 67,
    winTeam1: 56,
    winTeam2: 28,
    draw: 16,
  },
  {
    id: '2',
    team1: { name: 'Бразилия', flag: '🇧🇷' },
    team2: { name: 'Аргентина', flag: '🇦🇷' },
    score1: 1,
    score2: 1,
    minute: 45,
    winTeam1: 52,
    winTeam2: 35,
    draw: 13,
  },
  {
    id: '3',
    team1: { name: 'Англия', flag: '🇬🇧' },
    team2: { name: 'Нидерланды', flag: '🇳🇱' },
    score1: 3,
    score2: 2,
    minute: 82,
    winTeam1: 61,
    winTeam2: 24,
    draw: 15,
  },
];

export const upcomingMatches: Match[] = [
  {
    id: '4',
    team1: { name: 'Германия', flag: '🇩🇪' },
    team2: { name: 'Португалия', flag: '🇵🇹' },
    winTeam1: 58,
    winTeam2: 28,
    draw: 14,
    kickoff: '14:00',
  },
  {
    id: '5',
    team1: { name: 'Италия', flag: '🇮🇹' },
    team2: { name: 'Дания', flag: '🇩🇰' },
    winTeam1: 54,
    winTeam2: 32,
    draw: 14,
    kickoff: '17:00',
  },
  {
    id: '6',
    team1: { name: 'США', flag: '🇺🇸' },
    team2: { name: 'Канада', flag: '🇨🇦' },
    winTeam1: 51,
    winTeam2: 36,
    draw: 13,
    kickoff: '20:00',
  },
];

export const knockoutData = {
  roundOf32: [
    {
      team1: { name: 'Франция', flag: '🇫🇷' },
      team2: { name: 'Таиланд', flag: '🇹🇭' },
      winTeam1: 94,
      winTeam2: 6,
    },
    {
      team1: { name: 'Испания', flag: '🇪🇸' },
      team2: { name: 'Уругвай', flag: '🇺🇾' },
      winTeam1: 58,
      winTeam2: 42,
    },
    {
      team1: { name: 'Бразилия', flag: '🇧🇷' },
      team2: { name: 'Казахстан', flag: '🇰🇿' },
      winTeam1: 96,
      winTeam2: 4,
    },
    {
      team1: { name: 'Аргентина', flag: '🇦🇷' },
      team2: { name: 'Австрия', flag: '🇦🇹' },
      winTeam1: 72,
      winTeam2: 28,
    },
    {
      team1: { name: 'Англия', flag: '🇬🇧' },
      team2: { name: 'Оман', flag: '🇴🇲' },
      winTeam1: 92,
      winTeam2: 8,
    },
    {
      team1: { name: 'Нидерланды', flag: '🇳🇱' },
      team2: { name: 'Белгия', flag: '🇧🇪' },
      winTeam1: 54,
      winTeam2: 46,
    },
    {
      team1: { name: 'Германия', flag: '🇩🇪' },
      team2: { name: 'Польша', flag: '🇵🇱' },
      winTeam1: 69,
      winTeam2: 31,
    },
    {
      team1: { name: 'Португалия', flag: '🇵🇹' },
      team2: { name: 'Мексика', flag: '🇲🇽' },
      winTeam1: 61,
      winTeam2: 39,
    },
  ],
  quarterfinals: [
    {
      team1: { name: 'Франция', flag: '🇫🇷' },
      team2: { name: 'Испания', flag: '🇪🇸' },
      winTeam1: 56,
      winTeam2: 44,
    },
    {
      team1: { name: 'Бразилия', flag: '🇧🇷' },
      team2: { name: 'Аргентина', flag: '🇦🇷' },
      winTeam1: 52,
      winTeam2: 48,
    },
    {
      team1: { name: 'Англия', flag: '🇬🇧' },
      team2: { name: 'Нидерланды', flag: '🇳🇱' },
      winTeam1: 58,
      winTeam2: 42,
    },
    {
      team1: { name: 'Германия', flag: '🇩🇪' },
      team2: { name: 'Португалия', flag: '🇵🇹' },
      winTeam1: 64,
      winTeam2: 36,
    },
  ],
  semifinals: [
    {
      team1: { name: 'Франция', flag: '🇫🇷' },
      team2: { name: 'Бразилия', flag: '🇧🇷' },
      winTeam1: 48,
      winTeam2: 52,
    },
    {
      team1: { name: 'Англия', flag: '🇬🇧' },
      team2: { name: 'Германия', flag: '🇩🇪' },
      winTeam1: 54,
      winTeam2: 46,
    },
  ],
  final: [
    {
      team1: { name: 'Бразилия', flag: '🇧🇷' },
      team2: { name: 'Англия', flag: '🇬🇧' },
      winTeam1: 56,
      winTeam2: 44,
    },
  ],
};
