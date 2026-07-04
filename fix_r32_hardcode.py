with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = "const HARDCODED_RESULTS: Record<string, { home: number; away: number }> = {"
new = """const HARDCODED_RESULTS: Record<string, { home: number; away: number }> = {
  // Round of 32 (hardcoded — API does not support playoff stage)
  "South Africa_Canada":              { home: 0, away: 1 },
  "Canada_South Africa":              { home: 1, away: 0 },
  "Brazil_Japan":                     { home: 2, away: 1 },
  "Japan_Brazil":                     { home: 1, away: 2 },
  "Germany_Paraguay":                 { home: 1, away: 1 },
  "Paraguay_Germany":                 { home: 1, away: 1 },
  "Netherlands_Morocco":              { home: 1, away: 1 },
  "Morocco_Netherlands":              { home: 1, away: 1 },
  "Ivory Coast_Norway":               { home: 1, away: 2 },
  "Norway_Ivory Coast":               { home: 2, away: 1 },
  "France_Sweden":                    { home: 3, away: 0 },
  "Sweden_France":                    { home: 0, away: 3 },
  "Mexico_Ecuador":                   { home: 2, away: 0 },
  "Ecuador_Mexico":                   { home: 0, away: 2 },
  "England_D.R. Congo":               { home: 2, away: 1 },
  "D.R. Congo_England":               { home: 1, away: 2 },
  "Belgium_Senegal":                  { home: 3, away: 2 },
  "Senegal_Belgium":                  { home: 2, away: 3 },
  "USA_Bosnia & Herzegovina":         { home: 2, away: 0 },
  "Bosnia & Herzegovina_USA":         { home: 0, away: 2 },
  "Spain_Austria":                    { home: 3, away: 0 },
  "Austria_Spain":                    { home: 0, away: 3 },
  "Portugal_Croatia":                 { home: 2, away: 1 },
  "Croatia_Portugal":                 { home: 1, away: 2 },
  "Switzerland_Algeria":              { home: 2, away: 0 },
  "Algeria_Switzerland":              { home: 0, away: 2 },
  "Australia_Egypt":                  { home: 1, away: 1 },
  "Egypt_Australia":                  { home: 1, away: 1 },
  "Argentina_Cape Verde":             { home: 3, away: 2 },
  "Cape Verde_Argentina":             { home: 2, away: 3 },
  "Colombia_Ghana":                   { home: 1, away: 0 },
  "Ghana_Colombia":                   { home: 0, away: 1 },
  // Group stage (legacy){"""

if old in content:
    content = content.replace(old, new)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
