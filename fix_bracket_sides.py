with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = """  { matchNum:97,  group:'', home:'Morocco', homeFlag:'🇲🇦', away:'France', awayFlag:'🇫🇷', date:'2026-07-10', timeET:'00:00', stadium:'Gillette Stadium',        city:'Boston',              stage:'Quarterfinals' },
  { matchNum:98,  group:'', home:'Spain', homeFlag:'🇪🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-10', timeET:'23:00', stadium:'SoFi Stadium',            city:'Los Angeles',         stage:'Quarterfinals' },
  { matchNum:99,  group:'', home:'Norway', homeFlag:'🇳🇴', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-12', timeET:'01:00', stadium:'Hard Rock Stadium',       city:'Miami',               stage:'Quarterfinals' },
  { matchNum:100, group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Switzerland', awayFlag:'🇨🇭', date:'2026-07-12', timeET:'05:00', stadium:'Arrowhead Stadium',       city:'Kansas City',         stage:'Quarterfinals' },"""

new = """  { matchNum:99,  group:'', home:'Norway', homeFlag:'🇳🇴', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-12', timeET:'01:00', stadium:'Hard Rock Stadium',       city:'Miami',              stage:'Quarterfinals' },
  { matchNum:100, group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Switzerland', awayFlag:'🇨🇭', date:'2026-07-12', timeET:'05:00', stadium:'Arrowhead Stadium',      city:'Kansas City',          stage:'Quarterfinals' },
  { matchNum:97,  group:'', home:'Morocco', homeFlag:'🇲🇦', away:'France', awayFlag:'🇫🇷', date:'2026-07-10', timeET:'00:00', stadium:'Gillette Stadium',        city:'Boston',              stage:'Quarterfinals' },
  { matchNum:98,  group:'', home:'Spain', homeFlag:'🇪🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-10', timeET:'23:00', stadium:'SoFi Stadium',            city:'Los Angeles',         stage:'Quarterfinals' },"""

if old in content:
    content = content.replace(old, new)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('QF: Done')
else:
    print('QF: ERROR')

# Also swap SF order
old2 = """  { matchNum:101, group:'', home:'France', homeFlag:'🇫🇷', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-14', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Semifinals' },
  { matchNum:102, group:'', home:'England', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Argentina', awayFlag:'🇦🇷', date:'2026-07-15', timeET:'23:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Semifinals' },"""

new2 = """  { matchNum:102, group:'', home:'England', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Argentina', awayFlag:'🇦🇷', date:'2026-07-15', timeET:'23:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Semifinals' },
  { matchNum:101, group:'', home:'France', homeFlag:'🇫🇷', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-14', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Semifinals' },"""

if old2 in content:
    content = content.replace(old2, new2)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SF: Done')
else:
    print('SF: ERROR')
