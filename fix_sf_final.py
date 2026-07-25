with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ("home:'Winner M97', homeFlag:'🏳', away:'Winner M98', awayFlag:'🏳'",
     "home:'France', homeFlag:'🇫🇷', away:'Spain', awayFlag:'🇪🇸'"),
    ("home:'Winner M99', homeFlag:'🏳', away:'Winner M100',awayFlag:'🏳'",
     "home:'Argentina', homeFlag:'🇦🇷', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'"),
    ("home:'Loser M101', homeFlag:'🏳', away:'Loser M102', awayFlag:'🏳'",
     "home:'France', homeFlag:'🇫🇷', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'"),
    ("home:'WC Winner',  homeFlag:'🏳', away:'WC Runner-up',awayFlag:'🏳'",
     "home:'Spain', homeFlag:'🇪🇸', away:'Argentina', awayFlag:'🇦🇷'"),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f'OK: {old[:40]}')
    else:
        print(f'ERR: {old[:40]}')

with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Add results
with open('src/services/footballData.ts', encoding='utf-8') as f:
    content2 = f.read()

old2 = '  // Quarterfinals\n  "Morocco_France":'
new2 = '''  // Semifinals
  "France_Spain":        { home: 0, away: 2 },
  "Spain_France":        { home: 2, away: 0 },
  "Argentina_England":   { home: 2, away: 1 },
  "England_Argentina":   { home: 1, away: 2 },
  // Third Place
  "France_England":      { home: 4, away: 6 },
  "England_France":      { home: 6, away: 4 },
  // Final
  "Spain_Argentina":     { home: 1, away: 0 },
  "Argentina_Spain":     { home: 0, away: 1 },
  // Quarterfinals
  "Morocco_France":'''

if old2 in content2:
    content2 = content2.replace(old2, new2, 1)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content2)
    print('Results: Done')
else:
    print('Results: ERROR')
