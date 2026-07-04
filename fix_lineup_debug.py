with open('src/components/MatchDetailModal.tsx', encoding='utf-8') as f:
    content = f.read()

old = "    const hcKey = `${homeName}_${awayName}`;\n    if (HARDCODED_LINEUPS[hcKey]) {"
new = """    const hcKey = `${homeName}_${awayName}`;
    console.log('[LINEUP] hcKey:', hcKey, 'found:', !!HARDCODED_LINEUPS[hcKey]);
    if (HARDCODED_LINEUPS[hcKey]) {"""

if old in content:
    content = content.replace(old, new, 1)
    with open('src/components/MatchDetailModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
