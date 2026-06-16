new_component = '''import { useState } from "react";

const GROUPS: Record<string, string[]> = {
  A: ["Mexico", "South Korea", "South Africa", "Czechia"],
  B: ["Canada", "Bosnia & Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["USA", "Australia", "Paraguay", "Turkey"],
  E: ["Germany", "Ivory Coast", "Curaçao", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

const FLAGS: Record<string, string> = {
  Mexico:"🇲🇽","South Korea":"🇰🇷","South Africa":"🇿🇦","Czechia":"🇨🇿",
  Canada:"🇨🇦","Bosnia & Herzegovina":"🇧🇦","Qatar":"🇶🇦","Switzerland":"🇨🇭",
  Brazil:"🇧🇷","Morocco":"🇲🇦","Haiti":"🇭🇹","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  USA:"🇺🇸","Australia":"🇦🇺","Paraguay":"🇵🇾","Turkey":"🇹🇷",
  Germany:"🇩🇪","Ivory Coast":"🇨🇮","Curaçao":"🇨🇼","Ecuador":"🇪🇨",
  Netherlands:"🇳🇱","Japan":"🇯🇵","Sweden":"🇸🇪","Tunisia":"🇹🇳",
  Belgium:"🇧🇪","Egypt":"🇪🇬","Iran":"🇮🇷","New Zealand":"🇳🇿",
  Spain:"🇪🇸","Cape Verde":"🇨🇻","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾",
  France:"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴",
  Argentina:"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴",
  Portugal:"🇵🇹","DR Congo":"🇨🇩","Uzbekistan":"🇺🇿","Colombia":"🇨🇴",
  England:"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦",
};

const PLACE_COLORS = ["#C8D400","#aaaaaa","#cd7f32","#555555"];
const PLACE_LABELS = ["1ST","2ND","3RD","4TH"];

function GroupTable({ group, teams, ranking, onPick }: {
  group: string;
  teams: string[];
  ranking: (string|null)[];
  onPick: (team: string) => void;
}) {
  const isDone = ranking.every(Boolean);
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ background: "#E3000B", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: "16px", letterSpacing: "0.1em", color: "white" }}>GROUP {group}</span>
        {isDone && <span style={{ color: "#C8D400", fontSize: "14px" }}>✓</span>}
      </div>

      {/* Ranking slots */}
      <div style={{ padding: "10px 12px 4px" }}>
        {ranking.map((team, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", padding: "6px 8px", background: team ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", borderRadius: "6px", border: `1px solid ${team ? PLACE_COLORS[i] : "rgba(255,255,255,0.08)"}` }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: PLACE_COLORS[i], minWidth: "28px", fontFamily: "Anton, sans-serif" }}>{PLACE_LABELS[i]}</span>
            {team ? (
              <>
                <span style={{ fontSize: "16px" }}>{FLAGS[team] || "🏳"}</span>
                <span style={{ fontSize: "13px", color: "white", fontWeight: 600 }}>{team}</span>
                <button
                  onClick={() => onPick(team)}
                  style={{ marginLeft: "auto", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "4px", color: "#aaa", cursor: "pointer", fontSize: "11px", padding: "2px 6px" }}
                >✕</button>
              </>
            ) : (
              <span style={{ fontSize: "12px", color: "#555" }}>Pick team...</span>
            )}
          </div>
        ))}
      </div>

      {/* Team buttons */}
      <div style={{ padding: "4px 12px 12px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>Click to assign next place:</div>
        {teams.map(team => {
          const pos = ranking.indexOf(team);
          const picked = pos !== -1;
          return (
            <button
              key={team}
              onClick={() => !picked && onPick(team)}
              disabled={picked}
              style={{
                display: "flex", alignItems: "center", gap: "8px", width: "100%",
                background: picked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)",
                border: picked ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px", padding: "7px 10px", color: picked ? "#444" : "white",
                cursor: picked ? "not-allowed" : "pointer", marginBottom: "5px", fontSize: "13px",
                textDecoration: picked ? "line-through" : "none",
              }}
            >
              <span style={{ fontSize: "15px", opacity: picked ? 0.3 : 1 }}>{FLAGS[team] || "🏳"}</span>
              <span>{team}</span>
              {picked && <span style={{ marginLeft: "auto", fontSize: "11px", color: PLACE_COLORS[pos], fontWeight: 700 }}>{PLACE_LABELS[pos]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchupPick({ home, away, winner, onPick }: { home: string|null; away: string|null; winner: string|null; onPick: (t: string) => void }) {
  if (!home || !away) return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", marginBottom: "8px", color: "#444", fontSize: "12px", textAlign: "center" }}>TBD vs TBD</div>
  );
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", marginBottom: "8px" }}>
      {[home, away].map((team, i) => (
        <button key={i} onClick={() => onPick(team!)} style={{
          display: "flex", alignItems: "center", gap: "8px", width: "100%",
          background: winner === team ? "#E3000B" : "rgba(255,255,255,0.04)",
          border: winner === team ? "2px solid #E3000B" : "1px solid rgba(255,255,255,0.1)",
          borderRadius: "6px", padding: "8px 10px", color: "white", cursor: "pointer",
          marginBottom: i === 0 ? "6px" : "0", fontSize: "13px", fontWeight: winner === team ? 700 : 400,
        }}>
          <span style={{ fontSize: "16px" }}>{FLAGS[team!] || "🏳"}</span>
          <span>{team}</span>
          {winner === team && <span style={{ marginLeft: "auto", color: "#C8D400" }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

const INITIAL_RANKINGS: Record<string, (string|null)[]> = Object.fromEntries(
  Object.keys(GROUPS).map(g => [g, [null, null, null, null]])
);

export default function PredictTab() {
  const [rankings, setRankings] = useState<Record<string, (string|null)[]>>(INITIAL_RANKINGS);
  const [thirdPlace, setThirdPlace] = useState<string[]>([]);
  const [r32, setR32] = useState<(string|null)[]>(Array(16).fill(null));
  const [r16, setR16] = useState<(string|null)[]>(Array(8).fill(null));
  const [qf, setQf] = useState<(string|null)[]>(Array(4).fill(null));
  const [sf, setSf] = useState<(string|null)[]>(Array(2).fill(null));
  const [finalists, setFinalists] = useState<(string|null)[]>([null, null]);
  const [winner, setWinner] = useState<string|null>(null);

  const groupLetters = Object.keys(GROUPS);

  const handleGroupPick = (g: string, team: string) => {
    setRankings(prev => {
      const curr = [...prev[g]];
      const idx = curr.indexOf(team);
      if (idx !== -1) {
        curr[idx] = null;
        // shift remaining left
        const filled = curr.filter(Boolean);
        return { ...prev, [g]: [...filled, ...Array(4 - filled.length).fill(null)] };
      }
      const nextEmpty = curr.indexOf(null);
      if (nextEmpty === -1) return prev;
      curr[nextEmpty] = team;
      return { ...prev, [g]: curr };
    });
    // reset downstream
    setThirdPlace([]);
    setR32(Array(16).fill(null));
    setR16(Array(8).fill(null));
    setQf(Array(4).fill(null));
    setSf(Array(2).fill(null));
    setFinalists([null, null]);
    setWinner(null);
  };

  const allGroupsDone = groupLetters.every(g => rankings[g].every(Boolean));
  const thirds = groupLetters.map(g => rankings[g][2]).filter(Boolean) as string[];
  const thirdDone = thirdPlace.length === 8;

  const first = groupLetters.map(g => rankings[g][0] || null);
  const second = groupLetters.map(g => rankings[g][1] || null);

  const r32Pairs: [string|null, string|null][] = [
    [second[0], second[1]],[first[2],second[5]],[first[4],thirdPlace[0]||null],[first[5],second[2]],
    [second[4],second[8]],[first[8],thirdPlace[1]||null],[first[0],thirdPlace[2]||null],[first[11],thirdPlace[3]||null],
    [first[6],thirdPlace[4]||null],[first[3],thirdPlace[5]||null],[first[7],second[9]],[second[10],second[11]],
    [first[1],thirdPlace[6]||null],[second[3],second[6]],[second[7],first[9]],[first[10],thirdPlace[7]||null],
  ];

  const r32Done = r32.every(Boolean);
  const r16Done = r16.every(Boolean);
  const qfDone = qf.every(Boolean);
  const sfDone = sf.every(Boolean);
  const finalDone = finalists.every(Boolean);

  const reset = () => {
    setRankings(INITIAL_RANKINGS);
    setThirdPlace([]);
    setR32(Array(16).fill(null));
    setR16(Array(8).fill(null));
    setQf(Array(4).fill(null));
    setSf(Array(2).fill(null));
    setFinalists([null, null]);
    setWinner(null);
  };

  return (
    <div style={{ color: "white", paddingBottom: "60px" }}>
      <div style={{ background: "#0057A8", padding: "16px 20px", marginBottom: "24px", borderRadius: "8px" }}>
        <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: "28px", letterSpacing: "0.1em", margin: 0 }}>🏆 TOURNAMENT PREDICTOR</h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "4px 0 0" }}>Pick your winners all the way to the Final</p>
      </div>

      {/* STEP 1 */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "8px" }}>STEP 1 · GROUP STAGE</h2>
        <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px" }}>Click teams in order to set 1st, 2nd, 3rd, 4th place. Click again to remove.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {groupLetters.map(g => (
            <GroupTable key={g} group={g} teams={GROUPS[g]} ranking={rankings[g]} onPick={(t) => handleGroupPick(g, t)} />
          ))}
        </div>
      </div>

      {/* STEP 2 */}
      {allGroupsDone && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "8px" }}>STEP 2 · BEST 8 THIRD-PLACE TEAMS</h2>
          <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px" }}>Select 8 teams that advance ({thirdPlace.length}/8)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
            {thirds.map((team, i) => {
              const sel = thirdPlace.includes(team);
              return (
                <button key={team} onClick={() => setThirdPlace(p => sel ? p.filter(t => t !== team) : p.length < 8 ? [...p, team] : p)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: sel ? "#6B2D8B" : "rgba(255,255,255,0.05)", border: sel ? "2px solid #6B2D8B" : "2px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 12px", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: sel ? 700 : 400 }}>
                  <span style={{ fontSize: "16px" }}>{FLAGS[team] || "🏳"}</span>
                  <span>{team}</span>
                  <span style={{ marginLeft: "auto", fontSize: "11px", color: "#888" }}>GRP {groupLetters[i]}</span>
                  {sel && <span style={{ color: "#C8D400" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: R32 */}
      {allGroupsDone && thirdDone && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>STEP 3 · ROUND OF 32</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {r32Pairs.map(([h, a], i) => <MatchupPick key={i} home={h} away={a} winner={r32[i]} onPick={t => { const n=[...r32]; n[i]=t; setR32(n); setR16(Array(8).fill(null)); setQf(Array(4).fill(null)); setSf(Array(2).fill(null)); setFinalists([null,null]); setWinner(null); }} />)}
          </div>
        </div>
      )}

      {/* STEP 4: R16 */}
      {r32Done && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>STEP 4 · ROUND OF 16</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {Array.from({length:8},(_,i) => <MatchupPick key={i} home={r32[i*2]} away={r32[i*2+1]} winner={r16[i]} onPick={t => { const n=[...r16]; n[i]=t; setR16(n); setQf(Array(4).fill(null)); setSf(Array(2).fill(null)); setFinalists([null,null]); setWinner(null); }} />)}
          </div>
        </div>
      )}

      {/* STEP 5: QF */}
      {r16Done && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>STEP 5 · QUARTERFINALS</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {Array.from({length:4},(_,i) => <MatchupPick key={i} home={r16[i*2]} away={r16[i*2+1]} winner={qf[i]} onPick={t => { const n=[...qf]; n[i]=t; setQf(n); setSf(Array(2).fill(null)); setFinalists([null,null]); setWinner(null); }} />)}
          </div>
        </div>
      )}

      {/* STEP 6: SF */}
      {qfDone && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>STEP 6 · SEMIFINALS</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {Array.from({length:2},(_,i) => <MatchupPick key={i} home={qf[i*2]} away={qf[i*2+1]} winner={sf[i]} onPick={t => { const n=[...sf]; n[i]=t; setSf(n); setFinalists([null,null]); setWinner(null); }} />)}
          </div>
        </div>
      )}

      {/* STEP 7: FINAL */}
      {sfDone && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>STEP 7 · THE FINAL</h2>
          <div style={{ maxWidth: "400px" }}>
            <MatchupPick home={sf[0]} away={sf[1]} winner={finalists[0]} onPick={t => { setFinalists([t, t===sf[0]?sf[1]:sf[0]]); setWinner(null); }} />
          </div>
        </div>
      )}

      {/* STEP 8: WINNER */}
      {finalDone && finalists[0] && finalists[1] && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>🏆 WORLD CUP WINNER</h2>
          <div style={{ maxWidth: "400px" }}>
            <MatchupPick home={finalists[0]} away={finalists[1]} winner={winner} onPick={t => setWinner(t)} />
          </div>
        </div>
      )}

      {/* RESULT */}
      {winner && (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "linear-gradient(135deg, rgba(227,0,11,0.15), rgba(0,87,168,0.15))", borderRadius: "16px", border: "2px solid #C8D400", marginBottom: "32px" }}>
          <div style={{ fontSize: "64px", marginBottom: "12px" }}>{FLAGS[winner] || "🏳"}</div>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "36px", color: "#C8D400", letterSpacing: "0.1em", margin: "0 0 8px" }}>{winner}</h2>
          <p style={{ color: "#aaa", fontSize: "16px", marginBottom: "28px" }}>Your predicted World Cup 2026 Champion! 🎉</p>
          <button onClick={reset} style={{ background: "#E3000B", color: "white", border: "none", borderRadius: "8px", padding: "14px 36px", fontSize: "16px", fontWeight: 700, cursor: "pointer", fontFamily: "Anton, sans-serif", letterSpacing: "0.1em" }}>
            🔄 START AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
'''

with open('src/components/PredictTab.tsx', 'w', encoding='utf-8') as f:
    f.write(new_component)
print('Done')
