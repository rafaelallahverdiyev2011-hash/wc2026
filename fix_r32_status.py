with open('src/components/KnockoutTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = "        status: 'SCHEDULED' as const,"
new = """        status: (() => {
          const hcKey = `${f.home}_${f.away}`;
          const hcAlt = `${f.home}_${f.away}`.replace('D.R. Congo', 'DR Congo');
          return (HARDCODED_RESULTS[hcKey] || HARDCODED_RESULTS[hcAlt]) ? 'FINISHED' as const : 'SCHEDULED' as const;
        })(),"""

if old in content:
    content = content.replace(old, new, 1)
    with open('src/components/KnockoutTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
