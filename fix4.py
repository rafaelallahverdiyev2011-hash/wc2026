extra = """  { matchNum:89,  group:'', home:'Winner M73', homeFlag:'🏳', away:'Winner M75', awayFlag:'🏳', date:'2026-07-04', timeET:'21:00', stadium:'NRG Stadium',             city:'Houston',             stage:'Round of 16' },
  { matchNum:90,  group:'', home:'Winner M74', homeFlag:'🏳', away:'Winner M77', awayFlag:'🏳', date:'2026-07-05', timeET:'01:00', stadium:'Lincoln Financial Field', city:'Philadelphia',        stage:'Round of 16' },
  { matchNum:91,  group:'', home:'Winner M76', homeFlag:'🏳', away:'Winner M78', awayFlag:'🏳', date:'2026-07-06', timeET:'00:00', stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Round of 16' },
  { matchNum:92,  group:'', home:'Winner M79', homeFlag:'🏳', away:'Winner M80', awayFlag:'🏳', date:'2026-07-06', timeET:'04:00', stadium:'Estadio Azteca',          city:'Mexico City',         stage:'Round of 16' },
  { matchNum:93,  group:'', home:'Winner M83', homeFlag:'🏳', away:'Winner M84', awayFlag:'🏳', date:'2026-07-06', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Round of 16' },
  { matchNum:94,  group:'', home:'Winner M81', homeFlag:'🏳', away:'Winner M82', awayFlag:'🏳', date:'2026-07-07', timeET:'04:00', stadium:'Lumen Field',             city:'Seattle',             stage:'Round of 16' },
  { matchNum:95,  group:'', home:'Winner M86', homeFlag:'🏳', away:'Winner M88', awayFlag:'🏳', date:'2026-07-07', timeET:'20:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Round of 16' },
  { matchNum:96,  group:'', home:'Winner M85', homeFlag:'🏳', away:'Winner M87', awayFlag:'🏳', date:'2026-07-08', timeET:'00:00', stadium:'BC Place',                city:'Vancouver',           stage:'Round of 16' },
  { matchNum:97,  group:'', home:'Winner M89', homeFlag:'🏳', away:'Winner M90', awayFlag:'🏳', date:'2026-07-10', timeET:'00:00', stadium:'Gillette Stadium',        city:'Boston',              stage:'Quarterfinals' },
  { matchNum:98,  group:'', home:'Winner M93', homeFlag:'🏳', away:'Winner M94', awayFlag:'🏳', date:'2026-07-10', timeET:'23:00', stadium:'SoFi Stadium',            city:'Los Angeles',         stage:'Quarterfinals' },
  { matchNum:99,  group:'', home:'Winner M91', homeFlag:'🏳', away:'Winner M92', awayFlag:'🏳', date:'2026-07-12', timeET:'01:00', stadium:'Hard Rock Stadium',       city:'Miami',               stage:'Quarterfinals' },
  { matchNum:100, group:'', home:'Winner M95', homeFlag:'🏳', away:'Winner M96', awayFlag:'🏳', date:'2026-07-12', timeET:'05:00', stadium:'Arrowhead Stadium',       city:'Kansas City',         stage:'Quarterfinals' },
  { matchNum:101, group:'', home:'Winner M97', homeFlag:'🏳', away:'Winner M98', awayFlag:'🏳', date:'2026-07-14', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Semifinals' },
  { matchNum:102, group:'', home:'Winner M99', homeFlag:'🏳', away:'Winner M100',awayFlag:'🏳', date:'2026-07-15', timeET:'23:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Semifinals' },
  { matchNum:103, group:'', home:'Loser M101', homeFlag:'🏳', away:'Loser M102', awayFlag:'🏳', date:'2026-07-19', timeET:'01:00', stadium:'Hard Rock Stadium',       city:'Miami',               stage:'Third Place' },
  { matchNum:104, group:'', home:'WC Winner',  homeFlag:'🏳', away:'WC Runner-up',awayFlag:'🏳', date:'2026-07-19', timeET:'23:00', stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Final' },
"""
with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    lines = f.readlines()
lines.insert(183, extra)
with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
