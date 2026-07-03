with open('src/components/KnockoutTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = "      setAllMatches(merged);"
new = """      console.log('[KNOCKOUT] merged total:', merged.length);
      console.log('[KNOCKOUT] r32 matches:', merged.filter((m: FDMatch) => normaliseStage(m.stage) === 'Round of 32').map((m: FDMatch) => m.homeTeam.name + ' vs ' + m.awayTeam.name));
      setAllMatches(merged);"""

if old in content:
    content = content.replace(old, new, 1)
    with open('src/components/KnockoutTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
