with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

hardcoded_stats = '''
export const HARDCODED_STATS: Record<string, import("./footballData").MatchStatItem[]> = {
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
};
'''

old = "/** Match lineups via /wc/match/{id}/lineups. */"
new = hardcoded_stats + "\n/** Match lineups via /wc/match/{id}/lineups. */"

if old in content:
    content = content.replace(old, new, 1)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
    idx = content.find('Match lineups via')
    print('Found at:', idx)
