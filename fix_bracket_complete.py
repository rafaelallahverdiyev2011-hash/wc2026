with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

# R16 order must match R32 bracket flow:
# Left side: M73+M74→R16top, M75+M76→R16, M77+M78→R16, M79+M80→R16bottom
# Right side: M81+M82→R16, M83+M84→R16, M85+M86→R16, M87+M88→R16
# Winners: CAN, MAR, PAR, FRA, NOR, FRA→NOR, MEX, ENG
# R16 left: CAN vs MAR (M89), PAR vs FRA (M90), NOR vs BRA... wait

# Looking at actual results:
# M73: RSA vs CAN → CAN
# M74: BRA vs JPN → BRA  → M89 should be CAN vs MAR... 
# Actually M76: NED vs MAR → MAR
# So M73+M76 winners = CAN vs MAR = M89 ✓ (already correct pair)
# M74+M77: BRA vs NOR... but M77 is IVC vs NOR → NOR
# M74 BRA, M77 NOR → these should be R16 pair: BRA vs NOR = M91
# M75: GER vs PAR → PAR, M78: FRA vs SWE → FRA → PAR vs FRA = M90
# M79: MEX vs ECU → MEX, M80: ENG vs COD → ENG → MEX vs ENG = M92
# Right side:
# M81: BEL vs SEN → BEL, M82: USA vs BIH → USA → BEL vs USA... 
# but actual R16 was USA vs BEL = M94
# M83: ESP vs AUT → ESP, M84: POR vs CRO → POR → POR vs ESP = M93
# M85: SUI vs ALG → SUI, M86: AUS vs EGY → EGY → SUI vs COL... 
# M87: ARG vs CPV → ARG, M88: COL vs GHA → COL → ARG vs EGY... 
# M86 → EGY, M87 → ARG → ARG vs EGY = M95
# M85 → SUI, M88 → COL → SUI vs COL = M96

# So correct R16 order for bracket display:
# Left (indices 0-3): M90(PAR/FRA), M89(CAN/MAR), M91(BRA/NOR), M92(MEX/ENG)  
# Right (indices 4-7): M93(POR/ESP), M94(USA/BEL), M95(ARG/EGY), M96(SUI/COL)

old = """  { matchNum:90,  group:'', home:'Paraguay', homeFlag:'🇵🇾', away:'France', awayFlag:'🇫🇷', date:'2026-07-05', timeET:'01:00', stadium:'Lincoln Financial Field', city:'Philadelphia',        stage:'Round of 16' },
  { matchNum:89,  group:'', home:'Canada', homeFlag:'🇨🇦', away:'Morocco', awayFlag:'🇲🇦', date:'2026-07-04', timeET:'21:00', stadium:'NRG Stadium',             city:'Houston',             stage:'Round of 16' },
  { matchNum:93,  group:'', home:'Portugal', homeFlag:'🇵🇹', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-06', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Round of 16' },
  { matchNum:94,  group:'', home:'USA', homeFlag:'🇺🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-07', timeET:'04:00', stadium:'Lumen Field',             city:'Seattle',             stage:'Round of 16' },
  { matchNum:91,  group:'', home:'Brazil', homeFlag:'🇧🇷', away:'Norway', awayFlag:'🇳🇴', date:'2026-07-06', timeET:'00:00', stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Round of 16' },
  { matchNum:92,  group:'', home:'Mexico', homeFlag:'🇲🇽', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-06', timeET:'04:00', stadium:'Estadio Azteca',          city:'Mexico City',         stage:'Round of 16' },
  { matchNum:95,  group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Egypt', awayFlag:'🇪🇬', date:'2026-07-07', timeET:'20:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Round of 16' },
  { matchNum:96,  group:'', home:'Switzerland', homeFlag:'🇨🇭', away:'Colombia', awayFlag:'🇨🇴', date:'2026-07-08', timeET:'00:00', stadium:'BC Place',                city:'Vancouver',           stage:'Round of 16' },"""

new = """  { matchNum:89,  group:'', home:'Canada', homeFlag:'🇨🇦', away:'Morocco', awayFlag:'🇲🇦', date:'2026-07-04', timeET:'21:00', stadium:'NRG Stadium',             city:'Houston',             stage:'Round of 16' },
  { matchNum:90,  group:'', home:'Paraguay', homeFlag:'🇵🇾', away:'France', awayFlag:'🇫🇷', date:'2026-07-05', timeET:'01:00', stadium:'Lincoln Financial Field', city:'Philadelphia',        stage:'Round of 16' },
  { matchNum:91,  group:'', home:'Brazil', homeFlag:'🇧🇷', away:'Norway', awayFlag:'🇳🇴', date:'2026-07-06', timeET:'00:00', stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Round of 16' },
  { matchNum:92,  group:'', home:'Mexico', homeFlag:'🇲🇽', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-06', timeET:'04:00', stadium:'Estadio Azteca',          city:'Mexico City',         stage:'Round of 16' },
  { matchNum:93,  group:'', home:'Portugal', homeFlag:'🇵🇹', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-06', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Round of 16' },
  { matchNum:94,  group:'', home:'USA', homeFlag:'🇺🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-07', timeET:'04:00', stadium:'Lumen Field',             city:'Seattle',             stage:'Round of 16' },
  { matchNum:95,  group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Egypt', awayFlag:'🇪🇬', date:'2026-07-07', timeET:'20:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Round of 16' },
  { matchNum:96,  group:'', home:'Switzerland', homeFlag:'🇨🇭', away:'Colombia', awayFlag:'🇨🇴', date:'2026-07-08', timeET:'00:00', stadium:'BC Place',                city:'Vancouver',           stage:'Round of 16' },"""

if old in content:
    content = content.replace(old, new)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('R16: Done')
else:
    print('R16: ERROR')

# Also fix QF order to match: 
# left QF: M89+M90 winners = MAR vs FRA (M97), M91+M92 winners = NOR vs ENG (M99)
# right QF: M93+M94 winners = POR/ESP vs USA/BEL = ESP vs BEL (M98), M95+M96 winners = ARG vs SUI (M100)
old_qf = """  { matchNum:97,  group:'', home:'Morocco', homeFlag:'🇲🇦', away:'France', awayFlag:'🇫🇷', date:'2026-07-10', timeET:'00:00', stadium:'Gillette Stadium',        city:'Boston',              stage:'Quarterfinals' },
  { matchNum:98,  group:'', home:'Spain', homeFlag:'🇪🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-10', timeET:'23:00', stadium:'SoFi Stadium',            city:'Los Angeles',         stage:'Quarterfinals' },
  { matchNum:99,  group:'', home:'Norway', homeFlag:'🇳🇴', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-12', timeET:'01:00', stadium:'Hard Rock Stadium',       city:'Miami',               stage:'Quarterfinals' },
  { matchNum:100, group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Switzerland', awayFlag:'🇨🇭', date:'2026-07-12', timeET:'05:00', stadium:'Arrowhead Stadium',       city:'Kansas City',         stage:'Quarterfinals' },"""

new_qf = """  { matchNum:97,  group:'', home:'Morocco', homeFlag:'🇲🇦', away:'France', awayFlag:'🇫🇷', date:'2026-07-10', timeET:'00:00', stadium:'Gillette Stadium',        city:'Boston',              stage:'Quarterfinals' },
  { matchNum:99,  group:'', home:'Norway', homeFlag:'🇳🇴', away:'England', awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', date:'2026-07-12', timeET:'01:00', stadium:'Hard Rock Stadium',       city:'Miami',               stage:'Quarterfinals' },
  { matchNum:98,  group:'', home:'Spain', homeFlag:'🇪🇸', away:'Belgium', awayFlag:'🇧🇪', date:'2026-07-10', timeET:'23:00', stadium:'SoFi Stadium',            city:'Los Angeles',         stage:'Quarterfinals' },
  { matchNum:100, group:'', home:'Argentina', homeFlag:'🇦🇷', away:'Switzerland', awayFlag:'🇨🇭', date:'2026-07-12', timeET:'05:00', stadium:'Arrowhead Stadium',       city:'Kansas City',         stage:'Quarterfinals' },"""

if old_qf in content:
    content = content.replace(old_qf, new_qf)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('QF: Done')
else:
    print('QF: ERROR')

# SF: left = ENG/ARG (from left QF winners NOR/ENG and... wait
# Left QF: MAR/FRA → FRA, NOR/ENG → ENG → left SF: FRA vs ENG? No...
# Actually left SF = France vs Spain (M101), right SF = England vs Argentina (M102)
# But from bracket: left QF winners are FRA and ENG, right QF winners are ESP and ARG
# Left SF should be FRA vs ESP, right SF ENG vs ARG
old_sf = """  { matchNum:102, group:'', home:'England', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Argentina', awayFlag:'🇦🇷', date:'2026-07-15', timeET:'23:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Semifinals' },
  { matchNum:101, group:'', home:'France', homeFlag:'🇫🇷', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-14', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Semifinals' },"""

new_sf = """  { matchNum:101, group:'', home:'France', homeFlag:'🇫🇷', away:'Spain', awayFlag:'🇪🇸', date:'2026-07-14', timeET:'23:00', stadium:'AT&T Stadium',            city:'Dallas',              stage:'Semifinals' },
  { matchNum:102, group:'', home:'England', homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Argentina', awayFlag:'🇦🇷', date:'2026-07-15', timeET:'23:00', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',             stage:'Semifinals' },"""

if old_sf in content:
    content = content.replace(old_sf, new_sf)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SF: Done')
else:
    print('SF: ERROR')
