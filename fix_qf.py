with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ("home:'Winner M89', homeFlag:'🏳', away:'Winner M90', awayFlag:'🏳'",
     "home:'Morocco', homeFlag:'🇲🇦', away:'France', awayFlag:'🇫🇷'"),
    ("home:'Winner M93', homeFlag:'🏳', away:'Winner M94', awayFlag:'🏳'",
     "home:'Spain', homeFlag:'🇪🇸', away:'Belgium', awayFlag:'🇧🇪'"),
    ("home:'Winner M91', homeFlag:'🏳', away:'Winner M92', awayFlag:'🏳'",
     "home:'Norway', homeFlag:'🇳🇴', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'"),
    ("home:'Winner M95', homeFlag:'🏳', away:'Winner M96', awayFlag:'🏳'",
     "home:'Argentina', homeFlag:'🇦🇷', away:'Switzerland', awayFlag:'🇨🇭'"),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f'OK: {old[:40]}')
    else:
        print(f'ERR: {old[:40]}')

with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Add QF results to HARDCODED_RESULTS
with open('src/services/footballData.ts', encoding='utf-8') as f:
    content2 = f.read()

old2 = '  // Round of 16\n  "Canada_Morocco":'
new2 = '''  // Quarterfinals
  "Morocco_France":      { home: 0, away: 2 },
  "France_Morocco":      { home: 2, away: 0 },
  "Spain_Belgium":       { home: 2, away: 1 },
  "Belgium_Spain":       { home: 1, away: 2 },
  "Norway_England":      { home: 1, away: 2 },
  "England_Norway":      { home: 2, away: 1 },
  "Argentina_Switzerland": { home: 3, away: 1 },
  "Switzerland_Argentina": { home: 1, away: 3 },
  // Round of 16
  "Canada_Morocco":'''

if old2 in content2:
    content2 = content2.replace(old2, new2, 1)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content2)
    print('Results: Done')
else:
    print('Results: ERROR')
