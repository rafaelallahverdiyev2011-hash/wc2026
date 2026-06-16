import { useState, useEffect } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function supaFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...((options.headers as Record<string,string>) ?? {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const UPCOMING_MATCHES = [
  { matchNum:25, home:"Germany",     homeFlag:"🇩🇪", away:"Curacao",      awayFlag:"🇨🇼", date:"2026-06-14", timeET:"9:00 PM ET" },
  { matchNum:26, home:"Ivory Coast", homeFlag:"🇨🇮", away:"Ecuador",      awayFlag:"🇪🇨", date:"2026-06-15", timeET:"3:00 AM ET" },
  { matchNum:13, home:"Brazil",      homeFlag:"🇧🇷", away:"Morocco",      awayFlag:"🇲🇦", date:"2026-06-14", timeET:"2:00 AM ET" },
  { matchNum:20, home:"Australia",   homeFlag:"🇦🇺", away:"Turkiye",      awayFlag:"🇹🇷", date:"2026-06-14", timeET:"8:00 AM ET" },
  { matchNum:8,  home:"Qatar",       homeFlag:"🇶🇦", away:"Switzerland",  awayFlag:"🇨🇭", date:"2026-06-13", timeET:"11:00 PM ET" },
].filter(m => new Date(m.date) >= new Date(new Date().toDateString()));

interface LeaderRow { username: string; email: string; total_points: number; predictions_count: number; correct_scores: number; correct_winners: number; }
interface Prediction { match_num: number; predicted_home_score: number; predicted_away_score: number; }

export default function GameTab() {
  const [view, setView] = useState<"leaderboard"|"predict">("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"info"|"picks"|"done">("info");
  const [picks, setPicks] = useState<Record<number,{h:string,a:string}>>({});
  const [myPreds, setMyPreds] = useState<Prediction[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supaFetch("leaderboard?select=*&order=total_points.desc&limit=50")
      .then(setLeaderboard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (email && step === "picks") {
      supaFetch(`predictions?select=match_num,predicted_home_score,predicted_away_score&email=eq.${encodeURIComponent(email)}`)
        .then(setMyPreds)
        .catch(console.error);
    }
  }, [email, step]);

  const alreadyPredicted = (matchNum: number) => myPreds.some(p => p.match_num === matchNum);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const entries = Object.entries(picks);
      if (entries.length === 0) { setError("Make at least one prediction!"); setSubmitting(false); return; }
      
      for (const [matchNumStr, scores] of entries) {
        const matchNum = Number(matchNumStr);
        const match = UPCOMING_MATCHES.find(m => m.matchNum === matchNum);
        if (!match) continue;
        if (alreadyPredicted(matchNum)) continue;
        await supaFetch("predictions", {
          method: "POST",
          body: JSON.stringify({
            email, username, match_num: matchNum,
            home: match.home, away: match.away,
            predicted_home_score: Number(scores.h),
            predicted_away_score: Number(scores.a),
          }),
        });
      }

      // Upsert leaderboard entry
      const existing = leaderboard.find(r => r.email === email);
      if (!existing) {
        await supaFetch("leaderboard", {
          method: "POST",
          body: JSON.stringify({ email, username, total_points: 0, predictions_count: entries.length, correct_scores: 0, correct_winners: 0 }),
        });
      } else {
        await supaFetch(`leaderboard?email=eq.${encodeURIComponent(email)}`, {
          method: "PATCH",
          body: JSON.stringify({ predictions_count: existing.predictions_count + entries.length }),
        });
      }
      setStep("done");
    } catch(e) {
      setError("Something went wrong. Try again!");
    }
    setSubmitting(false);
  };

  const MEDAL = ["🥇","🥈","🥉"];

  return (
    <div style={{ color: "white", paddingBottom: "60px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #E3000B, #0057A8)", padding: "20px", marginBottom: "24px", borderRadius: "8px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Anton, sans-serif", fontSize: "32px", letterSpacing: "0.1em", margin: "0 0 4px" }}>🏆 PREDICTION GAME</h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0 }}>Predict match scores · Earn points · Climb the leaderboard</p>
      </div>

      {/* Points system */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "24px" }}>
        {[["⚽ Exact Score","5 pts","Predict the exact final score"],["✓ Correct Winner","3 pts","Predict who wins or draw"],["✗ Wrong","0 pts","Better luck next time"]].map(([title,pts,desc]) => (
          <div key={title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", marginBottom: "4px" }}>{title}</div>
            <div style={{ fontFamily: "Anton, sans-serif", fontSize: "22px", color: "#C8D400" }}>{pts}</div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {(["leaderboard","predict"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "10px", fontFamily: "Anton, sans-serif", fontSize: "14px", letterSpacing: "0.1em", border: "none", borderRadius: "6px", cursor: "pointer", background: view === v ? "#E3000B" : "rgba(255,255,255,0.06)", color: "white", textTransform: "uppercase" }}>
            {v === "leaderboard" ? "🏅 Leaderboard" : "⚽ Make Prediction"}
          </button>
        ))}
      </div>

      {/* LEADERBOARD */}
      {view === "leaderboard" && (
        <div>
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", marginBottom: "16px", letterSpacing: "0.1em" }}>GLOBAL LEADERBOARD</h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#555" }}>Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", color: "#555" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏆</div>
              <p>No predictions yet. Be the first!</p>
            </div>
          ) : (
            <div>
              {leaderboard.map((row, i) => (
                <div key={row.email} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", marginBottom: "6px", background: i < 3 ? "rgba(200,212,0,0.06)" : "rgba(255,255,255,0.03)", border: i < 3 ? "1px solid rgba(200,212,0,0.2)" : "1px solid rgba(255,255,255,0.06)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "20px", minWidth: "32px" }}>{MEDAL[i] ?? `#${i+1}`}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "Anton, sans-serif", fontSize: "16px", color: "white", margin: 0 }}>{row.username}</p>
                    <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>{row.predictions_count} predictions · {row.correct_scores} exact · {row.correct_winners} correct</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: "Anton, sans-serif", fontSize: "24px", color: "#C8D400" }}>{row.total_points}</span>
                    <span style={{ fontSize: "11px", color: "#555", marginLeft: "4px" }}>pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PREDICT */}
      {view === "predict" && (
        <div>
          {step === "info" && (
            <div style={{ maxWidth: "480px", margin: "0 auto" }}>
              <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", marginBottom: "16px" }}>ENTER YOUR DETAILS</h2>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Display Name</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name on leaderboard" style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
                <p style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>Used to track your predictions. Not shown publicly.</p>
              </div>
              <button onClick={() => { if (!username.trim() || !email.trim()) { setError("Fill in both fields!"); return; } setError(""); setStep("picks"); }} style={{ width: "100%", background: "#E3000B", color: "white", border: "none", borderRadius: "6px", padding: "14px", fontSize: "16px", fontFamily: "Anton, sans-serif", letterSpacing: "0.1em", cursor: "pointer" }}>
                CONTINUE →
              </button>
              {error && <p style={{ color: "#E3000B", fontSize: "13px", marginTop: "8px", textAlign: "center" }}>{error}</p>}
            </div>
          )}

          {step === "picks" && (
            <div>
              <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#C8D400", marginBottom: "4px" }}>PREDICT SCORES</h2>
              <p style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>Welcome {username}! Pick scores for upcoming matches.</p>
              {UPCOMING_MATCHES.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#555" }}>No upcoming matches available for prediction.</div>
              ) : (
                UPCOMING_MATCHES.map(match => {
                  const already = alreadyPredicted(match.matchNum);
                  const pred = myPreds.find(p => p.match_num === match.matchNum);
                  return (
                    <div key={match.matchNum} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "16px", marginBottom: "12px", opacity: already ? 0.6 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>Match #{match.matchNum}</span>
                        <span style={{ fontSize: "11px", color: "#888" }}>{match.timeET}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "28px" }}>{match.homeFlag}</div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "white", marginTop: "4px" }}>{match.home}</div>
                        </div>
                        {already ? (
                          <div style={{ textAlign: "center", padding: "0 16px" }}>
                            <div style={{ fontFamily: "Anton, sans-serif", fontSize: "24px", color: "#C8D400" }}>{pred?.predicted_home_score} – {pred?.predicted_away_score}</div>
                            <div style={{ fontSize: "11px", color: "#555" }}>Already predicted</div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input type="number" min="0" max="20" value={picks[match.matchNum]?.h ?? ""} onChange={e => setPicks(p => ({ ...p, [match.matchNum]: { h: e.target.value, a: p[match.matchNum]?.a ?? "0" } }))} style={{ width: "52px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "8px", color: "white", fontSize: "20px", fontFamily: "Anton, sans-serif", textAlign: "center", outline: "none" }} placeholder="0" />
                            <span style={{ fontFamily: "Anton, sans-serif", fontSize: "20px", color: "#444" }}>–</span>
                            <input type="number" min="0" max="20" value={picks[match.matchNum]?.a ?? ""} onChange={e => setPicks(p => ({ ...p, [match.matchNum]: { h: p[match.matchNum]?.h ?? "0", a: e.target.value } }))} style={{ width: "52px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "8px", color: "white", fontSize: "20px", fontFamily: "Anton, sans-serif", textAlign: "center", outline: "none" }} placeholder="0" />
                          </div>
                        )}
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "28px" }}>{match.awayFlag}</div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "white", marginTop: "4px" }}>{match.away}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {error && <p style={{ color: "#E3000B", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>{error}</p>}
              <button onClick={handleSubmit} disabled={submitting} style={{ width: "100%", background: submitting ? "#333" : "#E3000B", color: "white", border: "none", borderRadius: "6px", padding: "14px", fontSize: "16px", fontFamily: "Anton, sans-serif", letterSpacing: "0.1em", cursor: submitting ? "not-allowed" : "pointer", marginTop: "8px" }}>
                {submitting ? "SUBMITTING..." : "SUBMIT PREDICTIONS ✓"}
              </button>
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
              <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: "28px", color: "#C8D400", marginBottom: "8px" }}>PREDICTIONS SUBMITTED!</h2>
              <p style={{ color: "#888", marginBottom: "24px" }}>Points will be added automatically after each match ends.</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => { setStep("picks"); setPicks({}); }} style={{ background: "#E3000B", color: "white", border: "none", borderRadius: "6px", padding: "12px 24px", fontFamily: "Anton, sans-serif", cursor: "pointer", fontSize: "14px", letterSpacing: "0.1em" }}>MORE PREDICTIONS</button>
                <button onClick={() => setView("leaderboard")} style={{ background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "12px 24px", fontFamily: "Anton, sans-serif", cursor: "pointer", fontSize: "14px", letterSpacing: "0.1em" }}>VIEW LEADERBOARD</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
