with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = """function parseLineupResponse(data: unknown): MatchLineup {
  const empty: MatchLineup = {
    homeTeam: '', awayTeam: '', homeFormation: '', awayFormation: '',
    homeStartXI: [], awayStartXI: [], homeSubs: [], awaySubs: [],
  };
  if (!data || typeof data !== 'object') return empty;
  const d = data as Record<string, unknown>;
  const arr =
    Array.isArray(d.lineups) ? d.lineups :
    Array.isArray(d.data)    ? d.data    : null;
  if (!arr || arr.length < 2) return empty;

  function parsePlayers(lineup: unknown): MatchPlayer[] {
    const l = (lineup ?? {}) as Record<string, unknown>;
    const players: unknown[] =
      Array.isArray(l.startXI) ? l.startXI :
      Array.isArray(l.players) ? l.players : [];
    return players.map((p: unknown) => {
      const pl = ((p as Record<string, unknown>)?.player ?? p) as Record<string, unknown>;
      return { id: Number(pl.id ?? 0), name: String(pl.name ?? pl.player ?? ''), number: pl.number != null ? Number(pl.number) : null, position: String(pl.pos ?? pl.position ?? '') || null };
    });
  }

  function parseSubs(lineup: unknown): MatchPlayer[] {
    const l = (lineup ?? {}) as Record<string, unknown>;
    const subs: unknown[] = Array.isArray(l.substitutes) ? l.substitutes : Array.isArray(l.subs) ? l.subs : [];
    return subs.map((p: unknown) => {
      const pl = ((p as Record<string, unknown>)?.player ?? p) as Record<string, unknown>;
      return { id: Number(pl.id ?? 0), name: String(pl.name ?? pl.player ?? ''), number: pl.number != null ? Number(pl.number) : null, position: String(pl.pos ?? pl.position ?? '') || null };
    });
  }

  const h = arr[0] as Record<string, unknown>;
  const a = arr[1] as Record<string, unknown>;
  const hTeam = (h.team ?? {}) as Record<string, unknown>;
  const aTeam = (a.team ?? {}) as Record<string, unknown>;

  return {
    homeTeam: String(hTeam.name ?? ''),
    awayTeam: String(aTeam.name ?? ''),
    homeFormation: String(h.formation ?? ''),
    awayFormation: String(a.formation ?? ''),
    homeStartXI: parsePlayers(h),
    awayStartXI: parsePlayers(a),
    homeSubs: parseSubs(h),
    awaySubs: parseSubs(a),
  };
}"""

new = """function parseLineupResponse(data: unknown): MatchLineup {
  const empty: MatchLineup = {
    homeTeam: '', awayTeam: '', homeFormation: '', awayFormation: '',
    homeStartXI: [], awayStartXI: [], homeSubs: [], awaySubs: [],
  };
  if (!data || typeof data !== 'object') return empty;
  const d = data as Record<string, unknown>;
  const inner = (d.data ?? d) as Record<string, unknown>;

  function parsePlayers(players: unknown[]): MatchPlayer[] {
    return players.map((p: unknown) => {
      const pl = (p ?? {}) as Record<string, unknown>;
      return {
        id: 0,
        name: String(pl.name ?? pl.shortName ?? ''),
        number: pl.number != null ? Number(pl.number) : null,
        position: String(pl.role ?? pl.position ?? '') || null,
      };
    });
  }

  const startXI = (inner.startingXI ?? {}) as Record<string, unknown>;
  const subs = (inner.substitutes ?? {}) as Record<string, unknown>;
  const formation = (inner.formation ?? {}) as Record<string, unknown>;

  if (startXI.home || startXI.away) {
    return {
      homeTeam: '',
      awayTeam: '',
      homeFormation: String(formation.home ?? ''),
      awayFormation: String(formation.away ?? ''),
      homeStartXI: parsePlayers(Array.isArray(startXI.home) ? startXI.home : []),
      awayStartXI: parsePlayers(Array.isArray(startXI.away) ? startXI.away : []),
      homeSubs: parsePlayers(Array.isArray(subs.home) ? subs.home : []),
      awaySubs: parsePlayers(Array.isArray(subs.away) ? subs.away : []),
    };
  }

  const arr =
    Array.isArray(d.lineups) ? d.lineups :
    Array.isArray(d.data)    ? d.data    : null;
  if (!arr || arr.length < 2) return empty;
  const h = arr[0] as Record<string, unknown>;
  const a = arr[1] as Record<string, unknown>;
  const hTeam = (h.team ?? {}) as Record<string, unknown>;
  const aTeam = (a.team ?? {}) as Record<string, unknown>;
  return {
    homeTeam: String(hTeam.name ?? ''),
    awayTeam: String(aTeam.name ?? ''),
    homeFormation: String(h.formation ?? ''),
    awayFormation: String(a.formation ?? ''),
    homeStartXI: parsePlayers(Array.isArray(h.startXI) ? h.startXI : []),
    awayStartXI: parsePlayers(Array.isArray(a.startXI) ? a.startXI : []),
    homeSubs: parsePlayers(Array.isArray(h.substitutes) ? h.substitutes : []),
    awaySubs: parsePlayers(Array.isArray(a.substitutes) ? a.substitutes : []),
  };
}"""

if old in content:
    content = content.replace(old, new)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
