with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = "function buildFallbackStandings(): FDStandingGroup[] {"
new = """function buildFallbackStandings(): FDStandingGroup[] {
  // Hardcoded final group stage standings
  const FINAL_STANDINGS: Record<string, {name:string,mp:number,w:number,d:number,l:number,gf:number,ga:number,pts:number}[]> = {
    A: [
      {name:'Mexico',mp:3,w:3,d:0,l:0,gf:6,ga:0,pts:9},
      {name:'South Africa',mp:3,w:1,d:1,l:1,gf:2,ga:3,pts:4},
      {name:'South Korea',mp:3,w:1,d:0,l:2,gf:2,ga:3,pts:3},
      {name:'Czech Republic',mp:3,w:0,d:1,l:2,gf:2,ga:6,pts:1},
    ],
    B: [
      {name:'Switzerland',mp:3,w:2,d:1,l:0,gf:7,ga:3,pts:7},
      {name:'Canada',mp:3,w:1,d:1,l:1,gf:8,ga:3,pts:4},
      {name:'Bosnia & Herzegovina',mp:3,w:1,d:1,l:1,gf:5,ga:6,pts:4},
      {name:'Qatar',mp:3,w:0,d:1,l:2,gf:2,ga:10,pts:1},
    ],
    C: [
      {name:'Brazil',mp:3,w:2,d:1,l:0,gf:5,ga:1,pts:7},
      {name:'Morocco',mp:3,w:2,d:1,l:0,gf:6,ga:2,pts:7},
      {name:'Scotland',mp:3,w:1,d:0,l:2,gf:1,ga:4,pts:3},
      {name:'Haiti',mp:3,w:0,d:0,l:3,gf:2,ga:7,pts:0},
    ],
    D: [
      {name:'USA',mp:3,w:2,d:0,l:1,gf:8,ga:4,pts:6},
      {name:'Australia',mp:3,w:1,d:1,l:1,gf:2,ga:2,pts:4},
      {name:'Paraguay',mp:3,w:1,d:1,l:1,gf:2,ga:4,pts:4},
      {name:'Turkey',mp:3,w:1,d:0,l:2,gf:3,ga:5,pts:3},
    ],
    E: [
      {name:'Germany',mp:3,w:2,d:0,l:1,gf:10,ga:4,pts:6},
      {name:'Ivory Coast',mp:3,w:2,d:0,l:1,gf:4,ga:3,pts:6},
      {name:'Ecuador',mp:3,w:1,d:1,l:1,gf:2,ga:2,pts:4},
      {name:'Curacao',mp:3,w:0,d:1,l:2,gf:1,ga:8,pts:1},
    ],
    F: [
      {name:'Netherlands',mp:3,w:2,d:1,l:0,gf:10,ga:4,pts:7},
      {name:'Japan',mp:3,w:1,d:1,l:1,gf:7,ga:7,pts:4},
      {name:'Sweden',mp:3,w:1,d:1,l:1,gf:7,ga:7,pts:4},
      {name:'Tunisia',mp:3,w:0,d:1,l:2,gf:2,ga:8,pts:1},
    ],
    G: [
      {name:'Belgium',mp:3,w:1,d:2,l:0,gf:6,ga:6,pts:5},
      {name:'Egypt',mp:3,w:1,d:2,l:0,gf:5,ga:5,pts:5},
      {name:'Iran',mp:3,w:0,d:3,l:0,gf:3,ga:3,pts:3},
      {name:'New Zealand',mp:3,w:0,d:1,l:2,gf:4,ga:4,pts:1},
    ],
    H: [
      {name:'Spain',mp:3,w:2,d:1,l:0,gf:7,ga:1,pts:7},
      {name:'Uruguay',mp:3,w:0,d:2,l:1,gf:3,ga:4,pts:2},
      {name:'Cape Verde',mp:3,w:0,d:2,l:1,gf:2,ga:4,pts:2},
      {name:'Saudi Arabia',mp:3,w:0,d:3,l:0,gf:1,ga:4,pts:3},
    ],
    I: [
      {name:'France',mp:3,w:3,d:0,l:0,gf:10,ga:2,pts:9},
      {name:'Norway',mp:3,w:2,d:0,l:1,gf:9,ga:6,pts:6},
      {name:'Senegal',mp:3,w:1,d:0,l:2,gf:8,ga:6,pts:3},
      {name:'Iraq',mp:3,w:0,d:0,l:3,gf:1,ga:14,pts:0},
    ],
    J: [
      {name:'Argentina',mp:3,w:3,d:0,l:0,gf:8,ga:1,pts:9},
      {name:'Algeria',mp:3,w:1,d:0,l:2,gf:5,ga:7,pts:3},
      {name:'Austria',mp:3,w:1,d:0,l:2,gf:4,ga:6,pts:3},
      {name:'Jordan',mp:3,w:0,d:0,l:3,gf:2,ga:5,pts:0},
    ],
    K: [
      {name:'Portugal',mp:3,w:2,d:1,l:0,gf:7,ga:2,pts:7},
      {name:'Colombia',mp:3,w:2,d:0,l:1,gf:4,ga:2,pts:6},
      {name:'Uzbekistan',mp:3,w:0,d:1,l:2,gf:1,ga:8,pts:1},
      {name:'D.R. Congo',mp:3,w:0,d:2,l:1,gf:1,ga:1,pts:2},
    ],
    L: [
      {name:'England',mp:3,w:2,d:1,l:0,gf:4,ga:2,pts:7},
      {name:'Croatia',mp:3,w:1,d:0,l:2,gf:3,ga:4,pts:3},
      {name:'Ghana',mp:3,w:1,d:1,l:1,gf:1,ga:2,pts:4},
      {name:'Panama',mp:3,w:0,d:0,l:3,gf:0,ga:0,pts:0},
    ],
  };
  return Object.entries(FINAL_STANDINGS).map(([letter, teams]) => ({
    stage: 'GROUP_STAGE', type: 'TOTAL', group: `GROUP_${letter}`,
    table: teams.map((t, i) => ({
      position: i + 1,
      team: { id: 0, name: t.name, shortName: t.name, tla: t.name.slice(0, 3).toUpperCase(), crest: '' },
      playedGames: t.mp, won: t.w, draw: t.d, lost: t.l,
      goalsFor: t.gf, goalsAgainst: t.ga, goalDifference: t.gf - t.ga, points: t.pts, form: null,
    })),
  }));
"""

if old in content:
    content = content.replace(old, new, 1)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
