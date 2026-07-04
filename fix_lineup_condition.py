with open('src/components/MatchDetailModal.tsx', encoding='utf-8') as f:
    content = f.read()

old = """          {tab === 'lineups' && matchId ? (
            <LineupsTab matchId={matchId} info={staticInfo} match={match} />
          ) : tab === 'lineups' && (
            <EmptyState message="Lineups not yet available" />
          )}"""

new = """          {tab === 'lineups' && (matchId || staticInfo) ? (
            <LineupsTab matchId={matchId ?? 0} info={staticInfo} match={match} />
          ) : tab === 'lineups' && (
            <EmptyState message="Lineups not yet available" />
          )}"""

if old in content:
    content = content.replace(old, new, 1)
    with open('src/components/MatchDetailModal.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
