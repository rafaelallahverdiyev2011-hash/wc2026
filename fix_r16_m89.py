with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = "home:'Canada', homeFlag:'🇨🇦', away:'Paraguay', awayFlag:'🇵🇾', date:'2026-07-04'"
new = "home:'Canada', homeFlag:'🇨🇦', away:'Morocco', awayFlag:'🇲🇦', date:'2026-07-04'"

if old in content:
    content = content.replace(old, new)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
