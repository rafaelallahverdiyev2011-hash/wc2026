with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = '''    // If score is still null but teams have played, infer from standings
    if (match.score.fullTime.home === null || match.score.fullTime.away === null) {
      const homeName = typeof raw.home === 'string' ? raw.home : (raw.homeTeam as RawTeam)?.name ?? '';
      const awayName = typeof raw.away === 'string' ? raw.away : (raw.awayTeam as RawTeam)?.name ?? '';
      const inferred = inferScore(homeName, awayName, lookup);
      if (inferred) {
        const { hs, as_ } = inferred;
        const winner: FDScore[\'winner\'] = hs > as_ ? \'HOME_TEAM\' : as_ > hs ? \'AWAY_TEAM\' : \'DRAW\';
        console.log(`[WC API] INFERRED SCORE: ${homeName} ${hs}\\u2013${as_} ${awayName} (status: ${match.status}\\u2192FINISHED)`);
        return {
          ...match,
          status: \'FINISHED\' as MatchStatus,
          score: {
            ...match.score,
            winner,
            fullTime: { home: hs, away: as_ },
          },
        };
      }
    }'''

if old in content:
    content = content.replace(old, '    // inferScore disabled')
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done - removed inferScore')
else:
    # Try simpler approach - just remove the inferred score log lines effect
    print('Marker not found, trying grep approach')
