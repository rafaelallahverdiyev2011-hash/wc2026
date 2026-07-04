with open('src/components/KnockoutTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = "        score: { winner: null, duration: 'REGULAR' as const, fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },"
new = """        score: (() => {
          const hcKey = `${f.home}_${f.away}`;
          const hcAlt = `${f.home}_${f.away}`.replace('D.R. Congo', 'DR Congo');
          const hc = HARDCODED_RESULTS[hcKey] || HARDCODED_RESULTS[hcAlt] || null;
          const hs = hc ? hc.home : null;
          const as_ = hc ? hc.away : null;
          const winner = hs !== null && as_ !== null ? (hs > as_ ? 'HOME_TEAM' : as_ > hs ? 'AWAY_TEAM' : 'DRAW') : null;
          return { winner, duration: 'REGULAR' as const, fullTime: { home: hs, away: as_ }, halfTime: { home: null, away: null } };
        })(),"""

if old in content:
    content = content.replace(old, new)
    print('Step 2: Done')
else:
    print('ERROR: marker not found')
    # Show context
    import re
    idx = content.find('score: { winner: null')
    print('Found at:', idx)
    print(repr(content[idx:idx+120]))

with open('src/components/KnockoutTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
