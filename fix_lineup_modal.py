with open('src/components/MatchDetailModal.tsx', encoding='utf-8') as f:
    content = f.read()

# Add import
old = "  fetchMatchLineups,"
new = "  fetchMatchLineups,\n  HARDCODED_LINEUPS,"

if old in content:
    content = content.replace(old, new, 1)
    print('Step 1: import added')
else:
    print('ERROR step 1')

# Add hardcode check in LineupsTab
old2 = """  useEffect(() => {
    setLoading(true);
    fetchMatchLineups(matchId).then((l) => {
      setLineup(l);
      setLoading(false);
    });
  }, [matchId]);"""

new2 = """  useEffect(() => {
    setLoading(true);
    // Check hardcoded lineups first (for R32 matches not in API)
    const homeName = match?.homeTeam?.name ?? info?.home ?? '';
    const awayName = match?.awayTeam?.name ?? info?.away ?? '';
    const hcKey = `${homeName}_${awayName}`;
    if (HARDCODED_LINEUPS[hcKey]) {
      setLineup(HARDCODED_LINEUPS[hcKey]);
      setLoading(false);
      return;
    }
    fetchMatchLineups(matchId).then((l) => {
      setLineup(l);
      setLoading(false);
    });
  }, [matchId, match, info]);"""

if old2 in content:
    content = content.replace(old2, new2, 1)
    print('Step 2: hardcode check added')
else:
    print('ERROR step 2: marker not found')

with open('src/components/MatchDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
