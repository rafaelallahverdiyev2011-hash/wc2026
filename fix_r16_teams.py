with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ("home:'Winner M73', homeFlag:'🏳', away:'Winner M75', awayFlag:'🏳', date:'2026-07-04'",
     "home:'Canada', homeFlag:'🇨🇦', away:'Paraguay', awayFlag:'🇵🇾', date:'2026-07-04'"),
    ("home:'Winner M74', homeFlag:'🏳', away:'Winner M77', awayFlag:'🏳', date:'2026-07-05', timeET:'01:00'",
     "home:'Paraguay', homeFlag:'🇵🇾', away:'France', awayFlag:'🇫🇷', date:'2026-07-05', timeET:'01:00'"),
    ("home:'Winner M76', homeFlag:'🏳', away:'Winner M78', awayFlag:'🏳', date:'2026-07-06', timeET:'00:00'",
     "home:'Brazil', homeFlag:'🇧🇷', away:'Norway', awayFlag:'🇳🇴', date:'2026-07-06', timeET:'00:00'"),
    ("home:'Winner M79', homeFlag:'🏳', away:'Winner M80', awayFlag:'🏳', date:'2026-07-06', timeET:'04:00'",
     "home:'Mexico', homeFlag:'🇲🇽', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-06', timeET:'04:00'"),
    ("home:'Winner M83', homeFlag:'🏳', away:'Winner M84', awayFlag:'🏳'",
     "home:'Portugal', homeFlag:'🇵🇹', away:'Spain', awayFlag:'🇪🇸'"),
    ("home:'Winner M81', homeFlag:'🏳', away:'Winner M82', awayFlag:'🏳'",
     "home:'USA', homeFlag:'🇺🇸', away:'Belgium', awayFlag:'🇧🇪'"),
    ("home:'Winner M86', homeFlag:'🏳', away:'Winner M88', awayFlag:'🏳'",
     "home:'Argentina', homeFlag:'🇦🇷', away:'Egypt', awayFlag:'🇪🇬'"),
    ("home:'Winner M85', homeFlag:'🏳', away:'Winner M87', awayFlag:'🏳'",
     "home:'Switzerland', homeFlag:'🇨🇭', away:'Colombia', awayFlag:'🇨🇴'"),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f'OK: {old[:40]}')
    else:
        print(f'ERR: {old[:40]}')

with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
