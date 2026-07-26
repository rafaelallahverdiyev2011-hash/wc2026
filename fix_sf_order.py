with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = "home:'Argentina', homeFlag:'🇦🇷', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'"
new = "home:'England', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Argentina', awayFlag:'🇦🇷'"

if old in content:
    content = content.replace(old, new)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Schedule: Done')
else:
    print('Schedule: ERROR')

with open('src/services/footballData.ts', encoding='utf-8') as f:
    content2 = f.read()

old2 = '  "Argentina_England":   { home: 2, away: 1 },\n  "England_Argentina":   { home: 1, away: 2 },'
new2 = '  "England_Argentina":   { home: 1, away: 2 },\n  "Argentina_England":   { home: 2, away: 1 },'

if old2 in content2:
    content2 = content2.replace(old2, new2, 1)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content2)
    print('Results: Done')
else:
    print('Results: ERROR - checking existing')
    print('England_Argentina' in content2)
