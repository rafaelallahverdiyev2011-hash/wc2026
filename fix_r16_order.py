with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = """  { matchNum:89,  group:'', home:'Canada', homeFlag:'🇨🇦', away:'Morocco', awayFlag:'🇲🇦', date:'2026-07-04', timeET:'21:00', stadium:'NRG Stadium',             city:'Houston',             stage:'Round of 16' },
  { matchNum:90,  group:'', home:'Paraguay', homeFlag:'🇵🇾', away:'France', awayFlag:'🇫🇷', date:'2026-07-05', timeET:'01:00', stadium:'Lincoln Financial Field', city:'Philadelphia',        stage:'Round of 16' },
  { matchNum:91,  group:'', home:'Brazil', homeFlag:'🇧🇷', away:'Norway', awayFlag:'🇳🇴', date:'2026-07-06', timeET:'00:00', stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Round of 16' },
  { matchNum:92,  group:'', home:'Mexico', homeFlag:'🇲🇽', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-06', timeET:'04:00', stadium:'Estadio Azteca',          city:'Mexico City',         stage:'Round of 16' },
  { matchNum:93,  group:'', home:'Portugal', homeFlag:'🇵🇹', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-06', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Round of 16' },
  { matchNum:94,  group:'', home:'USA', homeFlag:'🇺🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-07', timeET:'04:00', stadium:'Lumen Field',             city:'Seattle',             stage:'Round of 16' },
  { matchNum:95,  group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Egypt', awayFlag:'🇪🇬', date:'2026-07-07', timeET:'20:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Round of 16' },
  { matchNum:96,  group:'', home:'Switzerland', homeFlag:'🇨🇭', away:'Colombia', awayFlag:'🇨🇴', date:'2026-07-08', timeET:'00:00', stadium:'BC Place',                city:'Vancouver',           stage:'Round of 16' },"""

new = """  { matchNum:90,  group:'', home:'Paraguay', homeFlag:'🇵🇾', away:'France', awayFlag:'🇫🇷', date:'2026-07-05', timeET:'01:00', stadium:'Lincoln Financial Field', city:'Philadelphia',        stage:'Round of 16' },
  { matchNum:89,  group:'', home:'Canada', homeFlag:'🇨🇦', away:'Morocco', awayFlag:'🇲🇦', date:'2026-07-04', timeET:'21:00', stadium:'NRG Stadium',             city:'Houston',             stage:'Round of 16' },
  { matchNum:93,  group:'', home:'Portugal', homeFlag:'🇵🇹', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-06', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Round of 16' },
  { matchNum:94,  group:'', home:'USA', homeFlag:'🇺🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-07', timeET:'04:00', stadium:'Lumen Field',             city:'Seattle',             stage:'Round of 16' },
  { matchNum:91,  group:'', home:'Brazil', homeFlag:'🇧🇷', away:'Norway', awayFlag:'🇳🇴', date:'2026-07-06', timeET:'00:00', stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Round of 16' },
  { matchNum:92,  group:'', home:'Mexico', homeFlag:'🇲🇽', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-06', timeET:'04:00', stadium:'Estadio Azteca',          city:'Mexico City',         stage:'Round of 16' },
  { matchNum:95,  group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Egypt', awayFlag:'🇪🇬', date:'2026-07-07', timeET:'20:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Round of 16' },
  { matchNum:96,  group:'', home:'Switzerland', homeFlag:'🇨🇭', away:'Colombia', awayFlag:'🇨🇴', date:'2026-07-08', timeET:'00:00', stadium:'BC Place',                city:'Vancouver',           stage:'Round of 16' },"""

if old in content:
    content = content.replace(old, new)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR')
