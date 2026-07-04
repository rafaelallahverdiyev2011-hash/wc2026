with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    content = f.read()

old = """  const isReversed = apiMatch != null && fuzzy(fixture.home, apiMatch.awayTeam.name) && fuzzy(fixture.away, apiMatch.homeTeam.name);
  const isLive     = liveMatch !== null;
  const isFinished = !isLive && apiMatch != null && isFinishedStatus(apiMatch.status);
  // Prefer live score, then API score
  const _hs = liveMatch?.score.fullTime.home ?? apiMatch?.score.fullTime.home ?? null;
  const _as = liveMatch?.score.fullTime.away ?? apiMatch?.score.fullTime.away ?? null;"""

new = """  const isReversed = apiMatch != null && fuzzy(fixture.home, apiMatch.awayTeam.name) && fuzzy(fixture.away, apiMatch.homeTeam.name);
  const isLive     = liveMatch !== null;
  const hcKey = `${fixture.home}_${fixture.away}`;
  const hc = HARDCODED_RESULTS[hcKey] ?? null;
  const isFinished = !isLive && (apiMatch != null && isFinishedStatus(apiMatch.status) || (hc !== null && apiMatch === null));
  // Prefer live score, then API score, then hardcoded
  const _hs = liveMatch?.score.fullTime.home ?? apiMatch?.score.fullTime.home ?? hc?.home ?? null;
  const _as = liveMatch?.score.fullTime.away ?? apiMatch?.score.fullTime.away ?? hc?.away ?? null;"""

if old in content:
    content = content.replace(old, new, 1)
    with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
