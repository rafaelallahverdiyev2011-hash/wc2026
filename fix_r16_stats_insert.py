with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = '''  "Colombia_Ghana": [
    {type:"Ball Possession",home:"61%",away:"39%"},
    {type:"Total Shots",home:18,away:8},
    {type:"Shots on Target",home:7,away:0},
    {type:"Corners",home:8,away:3},
    {type:"Fouls",home:9,away:11},
    {type:"Yellow Cards",home:1,away:2},
    {type:"Red Cards",home:0,away:0},
  ],
};'''

new = '''  "Colombia_Ghana": [
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
};'''

if old in content:
    content = content.replace(old, new, 1)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
