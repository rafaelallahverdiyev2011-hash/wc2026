with open('src/components/KnockoutTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = "  fetchAllMatches,\n  FDMatch,"
new = "  fetchAllMatches,\n  FDMatch,\n  HARDCODED_RESULTS,"

if old in content:
    content = content.replace(old, new)
    print('Done')
else:
    print('ERROR: marker not found')
    # find import block
    idx = content.find('fetchAllMatches')
    print(repr(content[idx-5:idx+60]))

with open('src/components/KnockoutTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
