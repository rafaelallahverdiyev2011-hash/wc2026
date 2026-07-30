with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

# Fix QF order: left = Norway+Argentina, right = Morocco+Spain
old_qf = """  { matchNum:99,  group:'', home:'Norway', homeFlag:'🇳🇴', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-12', timeET:'01:00', stadium:'Hard Rock Stadium',       city:'Miami',              stage:'Quarterfinals' },
  { matchNum:100, group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Switzerland', awayFlag:'🇨🇭', date:'2026-07-12', timeET:'05:00', stadium:'Arrowhead Stadium',      city:'Kansas City',          stage:'Quarterfinals' },
  { matchNum:97,  group:'', home:'Morocco', homeFlag:'🇲🇦', away:'France', awayFlag:'🇫🇷', date:'2026-07-10', timeET:'00:00', stadium:'Gillette Stadium',        city:'Boston',              stage:'Quarterfinals' },
  { matchNum:98,  group:'', home:'Spain', homeFlag:'🇪🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-10', timeET:'23:00', stadium:'SoFi Stadium',            city:'Los Angeles',         stage:'Quarterfinals' },"""

new_qf = """  { matchNum:97,  group:'', home:'Morocco', homeFlag:'🇲🇦', away:'France', awayFlag:'🇫🇷', date:'2026-07-10', timeET:'00:00', stadium:'Gillette Stadium',        city:'Boston',              stage:'Quarterfinals' },
  { matchNum:98,  group:'', home:'Spain', homeFlag:'🇪🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-10', timeET:'23:00', stadium:'SoFi Stadium',            city:'Los Angeles',         stage:'Quarterfinals' },
  { matchNum:99,  group:'', home:'Norway', homeFlag:'🇳🇴', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-12', timeET:'01:00', stadium:'Hard Rock Stadium',       city:'Miami',               stage:'Quarterfinals' },
  { matchNum:100, group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Switzerland', awayFlag:'🇨🇭', date:'2026-07-12', timeET:'05:00', stadium:'Arrowhead Stadium',       city:'Kansas City',         stage:'Quarterfinals' },"""

if old_qf in content:
    content = content.replace(old_qf, new_qf)
    print('QF: Done')
else:
    print('QF: ERROR')

# Fix SF: left = France/Spain, right = England/Argentina
old_sf = """  { matchNum:102, group:'', home:'England', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Argentina', awayFlag:'🇦🇷', date:'2026-07-15', timeET:'23:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Semifinals' },
  { matchNum:101, group:'', home:'France', homeFlag:'🇫🇷', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-14', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Semifinals' },"""

new_sf = """  { matchNum:101, group:'', home:'France', homeFlag:'🇫🇷', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-14', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Semifinals' },
  { matchNum:102, group:'', home:'England', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Argentina', awayFlag:'🇦🇷', date:'2026-07-15', timeET:'23:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Semifinals' },"""

if old_sf in content:
    content = content.replace(old_sf, new_sf)
    print('SF: Done')
else:
    print('SF: ERROR')

with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
