with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

# Add import
old = "  fetchAllMatches,"
new = "  fetchAllMatches,\n  HARDCODED_RESULTS,"

if old in content:
    content = content.replace(old, new, 1)
    print('Step 1: import added')
else:
    print('ERROR step 1')

# Apply hardcode when apiMatch not found
old2 = """  const isReversed = apiMatch != null && fuzzy(fixture.home, apiMatch.awayTeam.name) && fuzzy(fixture.away, apiMatch.homeTeam.name);

  const isFinished = !isLive && apiMatch != null && isFinishedStatus(apiMatch.status);

  // Prefer live score, then API score
  const _hs = liveMatch?.score.fullTime.home ?? apiMatch?.score.fullTime.home ?? null;
  const _as = liveMatch?.score.fullTime.away ?? apiMatch?.score.fullTime.away ?? null;"""

new2 = """  const isReversed = apiMatch != null && fuzzy(fixture.home, apiMatch.awayTeam.name) && fuzzy(fixture.away, apiMatch.homeTeam.name);

  // Fallback to hardcoded results for R32 matches not in API
  const hcKey = `${fixture.home}_${fixture.away}`;
  const hc = HARDCODED_RESULTS[hcKey] ?? null;
  const isFinished = !isLive && (apiMatch != null && isFinishedStatus(apiMatch.status) || (hc !== null && apiMatch === null));

  // Prefer live score, then API score, then hardcoded
  const _hs = liveMatch?.score.fullTime.home ?? apiMatch?.score.fullTime.home ?? hc?.home ?? null;
  const _as = liveMatch?.score.fullTime.away ?? apiMatch?.score.fullTime.away ?? hc?.away ?? null;"""

if old2 in content:
    content = content.replace(old2, new2, 1)
    print('Step 2: hardcode applied')
else:
    print('ERROR step 2: marker not found')

with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
