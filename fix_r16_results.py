with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = '  // Group stage (legacy)\n  "Mexico_South Africa": { home: 2, away: 0 },'
new = '''  // Round of 16
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
  "Mexico_South Africa": { home: 2, away: 0 },'''

if old in content:
    content = content.replace(old, new)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
