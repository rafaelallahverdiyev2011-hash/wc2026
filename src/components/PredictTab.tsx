import { useState } from "react";

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

type Stage = "groups" | "third" | "r32" | "r16" | "qf" | "sf" | "final" | "winner";

interface PredictState {
  stage: Stage;
  groupFirst: Record<string, string>;
  groupSecond: Record<string, string>;
  thirdPlace: string[];
  r32: (string | null)[];
  r16: (string | null)[];
  qf: (string | null)[];
  sf: (string | null)[];
  finalist: (string | null)[];
  winner: string | null;
}

function TeamButton({ team, selected, onClick }: { team: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-left transition-all duration-150 font-inter"
      style={{
        background: selected ? "#0057A8" : "rgba(255,255,255,0.05)",
        border: selected ? "2px solid #0057A8" : "2px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        color: selected ? "#ffffff" : "#cccccc",
        fontSize: "13px",
        fontWeight: selected ? 700 : 400,
        cursor: "pointer",
        marginBottom: "6px",
      }}
    >
      <span style={{ fontSize: "18px" }}>{FLAGS[team] || "🏳"}</span>
      <span>{team}</span>
      {selected && <span style={{ marginLeft: "auto", color: "#C8D400" }}>✓</span>}
    </button>
  );
}

function MatchupPick({
  home, away, winner, onPick,
}: { home: string | null; away: string | null; winner: string | null; onPick: (team: string) => void }) {
  if (!home || !away) return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", marginBottom: "8px", color: "#666", fontSize: "12px" }}>
      TBD vs TBD
    </div>
  );
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px", marginBottom: "8px" }}>
      <button onClick={() => onPick(home)} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: winner === home ? "#E3000B" : "transparent", border: winner === home ? "none" : "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "8px 10px", color: "white", cursor: "pointer", marginBottom: "6px", fontSize: "13px", fontWeight: winner === home ? 700 : 400 }}>
        <span style={{ fontSize: "16px" }}>{FLAGS[home] || "🏳"}</span>
        <span>{home}</span>
        {winner === home && <span style={{ marginLeft: "auto", color: "#C8D400" }}>✓</span>}
      </button>
      <div style={{ textAlign: "center", color: "#666", fontSize: "11px", margin: "2px 0" }}>vs</div>
      <button onClick={() => onPick(away)} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: winner === away ? "#E3000B" : "transparent", border: winner === away ? "none" : "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "8px 10px", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: winner === away ? 700 : 400 }}>
        <span style={{ fontSize: "16px" }}>{FLAGS[away] || "🏳"}</span>
        <span>{away}</span>
        {winner === away && <span style={{ marginLeft: "auto", color: "#C8D400" }}>✓</span>}
      </button>
    </div>
  );
}

const INITIAL: PredictState = {
  stage: "groups",
  groupFirst: {}, groupSecond: {}, thirdPlace: [],
  r32: Array(16).fill(null),
  r16: Array(8).fill(null),
  qf: Array(4).fill(null),
  sf: Array(2).fill(null),
  finalist: Array(2).fill(null),
  winner: null,
};

export default function PredictTab() {
  const [state, setState] = useState<PredictState>(INITIAL);

  const groupLetters = Object.keys(GROUPS);
  const allGroupsDone = groupLetters.every(g => state.groupFirst[g] && state.groupSecond[g]);
  const thirdTeams = groupLetters.map(g => {
    const taken = [state.groupFirst[g], state.groupSecond[g]].filter(Boolean);
    return GROUPS[g].find(t => !taken.includes(t)) || null;
  }).filter(Boolean) as string[];
  const thirdDone = state.thirdPlace.length === 8;

  // Build R32 matchups after group+third selection
  const getR32Teams = () => {
    const first = groupLetters.map(g => state.groupFirst[g] || null);
    const second = groupLetters.map(g => state.groupSecond[g] || null);
    const third = [...state.thirdPlace, ...Array(8 - state.thirdPlace.length).fill(null)];
    // R32 pairings (simplified - runner-up A vs runner-up B, etc.)
    return [
      [second[0], second[1]], [first[2], second[5]],
      [first[4], third[0]], [first[5], second[2]],
      [second[4], second[8]], [first[8], third[1]],
      [first[0], third[2]], [first[11], third[3]],
      [first[6], third[4]], [first[3], third[5]],
      [first[7], second[9]], [second[10], second[11]],
      [first[1], third[6]], [second[3], second[6]],
      [second[7], first[9]], [first[10], third[7]],
    ];
  };

  const r32Matchups = getR32Teams();

  const pickR32 = (i: number, team: string) => {
    const newR32 = [...state.r32];
    newR32[i] = team;
    setState(s => ({ ...s, r32: newR32 }));
  };

  const pickR16 = (i: number, team: string) => {
    const newR16 = [...state.r16];
    newR16[i] = team;
    setState(s => ({ ...s, r16: newR16 }));
  };

  const pickQF = (i: number, team: string) => {
    const newQF = [...state.qf];
    newQF[i] = team;
    setState(s => ({ ...s, qf: newQF }));
  };

  const pickSF = (i: number, team: string) => {
    const newSF = [...state.sf];
    newSF[i] = team;
    setState(s => ({ ...s, sf: newSF }));
  };

  const r32Done = state.r32.every(Boolean);
  const r16Done = state.r16.every(Boolean);
  const qfDone = state.qf.every(Boolean);
  const sfDone = state.sf.every(Boolean);
  const finalistsDone = state.finalist.every(Boolean);

  return (
    <div style={{ color: "white", paddingBottom: "60px" }}>
      {/* HEADER */}
      <div style={{ background: "#0057A8", padding: "16px 20px", marginBottom: "24px", borderRadius: "8px" }}>
        <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: "28px", letterSpacing: "0.1em", margin: 0 }}>
          🏆 TOURNAMENT PREDICTOR
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "4px 0 0" }}>
          Pick your winners all the way to the Final
        </p>
      </div>

      {/* STEP 1: GROUPS */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>
          STEP 1 · GROUP STAGE
        </h2>
        <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px" }}>Select 1st and 2nd place from each group</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {groupLetters.map(g => (
            <div key={g} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "14px" }}>
              <div style={{ fontFamily: "Anton, sans-serif", fontSize: "16px", color: "#E3000B", marginBottom: "10px", letterSpacing: "0.1em" }}>
                GROUP {g}
                {state.groupFirst[g] && state.groupSecond[g] && <span style={{ color: "#00A850", marginLeft: "8px", fontSize: "12px" }}>✓</span>}
              </div>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>1st place:</div>
              {GROUPS[g].map(team => (
                <TeamButton
                  key={team}
                  team={team}
                  selected={state.groupFirst[g] === team}
                  onClick={() => {
                    if (state.groupSecond[g] === team) return;
                    setState(s => ({ ...s, groupFirst: { ...s.groupFirst, [g]: team } }));
                  }}
                />
              ))}
              <div style={{ fontSize: "11px", color: "#888", margin: "10px 0 6px" }}>2nd place:</div>
              {GROUPS[g].map(team => (
                <TeamButton
                  key={team}
                  team={team}
                  selected={state.groupSecond[g] === team}
                  onClick={() => {
                    if (state.groupFirst[g] === team) return;
                    setState(s => ({ ...s, groupSecond: { ...s.groupSecond, [g]: team } }));
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 2: BEST 3RD PLACES */}
      {allGroupsDone && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 2 · BEST 8 THIRD-PLACE TEAMS
          </h2>
          <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px" }}>
            Select 8 teams that advance from 3rd place ({state.thirdPlace.length}/8 selected)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
            {thirdTeams.map((team, i) => {
              const grp = groupLetters[i];
              const isSelected = state.thirdPlace.includes(team);
              return (
                <button
                  key={team}
                  onClick={() => {
                    setState(s => {
                      const tp = s.thirdPlace.includes(team)
                        ? s.thirdPlace.filter(t => t !== team)
                        : s.thirdPlace.length < 8 ? [...s.thirdPlace, team] : s.thirdPlace;
                      return { ...s, thirdPlace: tp };
                    });
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: isSelected ? "#6B2D8B" : "rgba(255,255,255,0.05)",
                    border: isSelected ? "2px solid #6B2D8B" : "2px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px", padding: "10px 12px", color: "white", cursor: "pointer",
                    fontSize: "13px", fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{FLAGS[team] || "🏳"}</span>
                  <span>{team}</span>
                  <span style={{ marginLeft: "auto", fontSize: "11px", color: "#888" }}>GRP {grp}</span>
                  {isSelected && <span style={{ color: "#C8D400" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: ROUND OF 32 */}
      {allGroupsDone && thirdDone && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 3 · ROUND OF 32
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {r32Matchups.map(([home, away], i) => (
              <MatchupPick key={i} home={home} away={away} winner={state.r32[i]} onPick={(t) => pickR32(i, t)} />
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: ROUND OF 16 */}
      {r32Done && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 4 · ROUND OF 16
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {Array.from({ length: 8 }, (_, i) => (
              <MatchupPick key={i} home={state.r32[i * 2]} away={state.r32[i * 2 + 1]} winner={state.r16[i]} onPick={(t) => pickR16(i, t)} />
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: QUARTERFINALS */}
      {r16Done && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 5 · QUARTERFINALS
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {Array.from({ length: 4 }, (_, i) => (
              <MatchupPick key={i} home={state.r16[i * 2]} away={state.r16[i * 2 + 1]} winner={state.qf[i]} onPick={(t) => pickQF(i, t)} />
            ))}
          </div>
        </div>
      )}

      {/* STEP 6: SEMIFINALS */}
      {qfDone && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 6 · SEMIFINALS
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {Array.from({ length: 2 }, (_, i) => (
              <MatchupPick key={i} home={state.qf[i * 2]} away={state.qf[i * 2 + 1]} winner={state.sf[i]} onPick={(t) => pickSF(i, t)} />
            ))}
          </div>
        </div>
      )}

      {/* STEP 7: FINAL */}
      {sfDone && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>
            STEP 7 · THE FINAL
          </h2>
          <div style={{ maxWidth: "400px" }}>
            <MatchupPick
              home={state.sf[0]} away={state.sf[1]}
              winner={state.finalist[0]}
              onPick={(t) => setState(s => ({ ...s, finalist: [t, t === s.sf[0] ? s.sf[1] : s.sf[0]] }))}
            />
          </div>
        </div>
      )}

      {/* WINNER */}
      {finalistsDone && state.finalist[0] && state.finalist[1] && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", letterSpacing: "0.1em", marginBottom: "16px" }}>
            🏆 WORLD CUP WINNER
          </h2>
          <div style={{ maxWidth: "400px" }}>
            <MatchupPick
              home={state.finalist[0]} away={state.finalist[1]}
              winner={state.winner}
              onPick={(t) => setState(s => ({ ...s, winner: t }))}
            />
          </div>
        </div>
      )}

      {/* RESULT */}
      {state.winner && (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "linear-gradient(135deg, rgba(227,0,11,0.2), rgba(0,87,168,0.2))", borderRadius: "16px", border: "2px solid #C8D400", marginBottom: "32px" }}>
          <div style={{ fontSize: "60px", marginBottom: "12px" }}>{FLAGS[state.winner] || "🏳"}</div>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "32px", color: "#C8D400", letterSpacing: "0.1em", margin: "0 0 8px" }}>
            {state.winner}
          </h2>
          <p style={{ color: "#aaa", fontSize: "16px", marginBottom: "24px" }}>Your predicted World Cup 2026 Champion!</p>
          <button
            onClick={() => setState(INITIAL)}
            style={{ background: "#E3000B", color: "white", border: "none", borderRadius: "8px", padding: "14px 32px", fontSize: "16px", fontWeight: 700, cursor: "pointer", fontFamily: "Anton, sans-serif", letterSpacing: "0.1em" }}
          >
            🔄 START AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
