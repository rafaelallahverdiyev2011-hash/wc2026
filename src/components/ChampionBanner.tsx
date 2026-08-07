import { useMemo, useState } from 'react';

// Replaces the countdown now that the tournament is over.
// Spain — 2026 World Champions (1-0 Argentina, AET, Ferran Torres 106')

const TOURNAMENT_STATS = [
  { value: '308', label: 'GOALS SCORED', color: '#E3000B' },
  { value: '104', label: 'MATCHES PLAYED', color: '#0057A8' },
  { value: '48', label: 'NATIONS', color: '#6B2D8B' },
  { value: '6B+', label: 'GLOBAL VIEWERS', color: '#00A850' },
];

const MATCH_STATS: { label: string; spain: number; argentina: number; note?: [string, string] }[] = [
  { label: 'Ball Possession', spain: 65, argentina: 35 },
  { label: 'Expected Goals (xG)', spain: 2.29, argentina: 0.22 },
  { label: 'Total Shots', spain: 20, argentina: 2 },
  { label: 'Shots on Target', spain: 12, argentina: 0 },
  { label: 'Big Chances', spain: 4, argentina: 0 },
  { label: 'Accurate Passes', spain: 763, argentina: 357, note: ['89%', '77%'] },
];

const SPAIN_XI = [
  'Unai Simón (GK)', 'Pedro Porro', 'Pau Cubarsí', 'Aymeric Laporte', 'Marc Cucurella',
  'Rodri', 'Fabián Ruiz', 'Lamine Yamal', 'Dani Olmo', 'Álex Baena', 'Mikel Oyarzabal',
];

const ARGENTINA_XI = [
  'Emiliano Martínez (GK)', 'Nahuel Molina', 'Cristian Romero', 'Lisandro Martínez', 'Nicolás Tagliafico',
  'Rodrigo De Paul', 'Enzo Fernández', 'Leandro Paredes', 'Alexis Mac Allister', 'Julián Álvarez', 'Lionel Messi',
];

const GOLD = '#C8D400';
const CONFETTI_COLORS = ['#C8D400', '#E3000B', '#ffffff', '#00A850', '#0057A8', '#6B2D8B'];

export default function ChampionBanner() {
  const [showModal, setShowModal] = useState(false);

  const confetti = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 4 + Math.random() * 4,
        size: 5 + Math.random() * 5,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
      })),
    []
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 90,
        size: 10 + Math.random() * 12,
        duration: 1.5 + Math.random() * 2,
        delay: Math.random() * 3,
      })),
    []
  );

  return (
    <div className="relative pb-10 md:pb-14 overflow-hidden">
      <style>{`
        @keyframes goldShimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes spinRing { 0%{transform:translate(-50%,-50%) rotate(0deg)} 100%{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes pulseGlow { 0%,100%{opacity:.55;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.9;transform:translate(-50%,-50%) scale(1.1)} }
        @keyframes trophyBounce { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-4px) rotate(-4deg)} }
        @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0);opacity:0} 10%{opacity:1} 100%{transform:translateY(260px) rotate(360deg);opacity:0} }
        @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(0.7)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes borderCycle { 0%{border-color:#E3000B} 20%{border-color:#6B2D8B} 40%{border-color:#0057A8} 60%{border-color:#00A850} 80%{border-color:#C8D400} 100%{border-color:#E3000B} }
        .champion-title{background:linear-gradient(90deg,${GOLD},#ffffff,${GOLD},#a8b400);background-size:300% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:goldShimmer 4s ease-in-out infinite;}
        .rainbow-ring{position:absolute;top:38%;left:50%;width:720px;height:720px;max-width:150vw;max-height:150vw;border-radius:9999px;background:conic-gradient(from 0deg, #E3000B, #6B2D8B, #0057A8, #00A850, #C8D400, #E3000B);opacity:.4;filter:blur(55px);animation:spinRing 14s linear infinite;pointer-events:none;}
        .rainbow-ring-mid{position:absolute;top:38%;left:50%;width:500px;height:500px;max-width:110vw;max-height:110vw;border-radius:9999px;background:conic-gradient(from 90deg, #00A850, #C8D400, #E3000B, #6B2D8B, #0057A8, #00A850);opacity:.42;filter:blur(38px);animation:spinRing 9s linear infinite reverse;pointer-events:none;}
        .rainbow-ring-inner{position:absolute;top:38%;left:50%;width:320px;height:320px;max-width:75vw;max-height:75vw;border-radius:9999px;background:conic-gradient(from 180deg, #C8D400, #E3000B, #0057A8, #00A850, #6B2D8B, #C8D400);opacity:.45;filter:blur(24px);animation:spinRing 6s linear infinite;pointer-events:none;}
        .pulse-core{position:absolute;top:38%;left:50%;width:260px;height:260px;background:radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%);animation:pulseGlow 3.5s ease-in-out infinite;pointer-events:none;}
        .trophy-icon{display:inline-block;animation:trophyBounce 2.2s ease-in-out infinite;}
        .confetti-piece{position:absolute;top:0;border-radius:2px;animation:confettiFall linear infinite;}
        .sparkle{position:absolute;color:#ffffff;animation:twinkle ease-in-out infinite;pointer-events:none;}
        .score-card{transition:transform .15s ease, box-shadow .15s ease;border:3px solid #E3000B !important;animation:borderCycle 5s linear infinite;}
        .score-card:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 12px 32px rgba(200,212,0,0.35);}
      `}</style>

      <div className="rainbow-ring" />
      <div className="rainbow-ring-mid" />
      <div className="rainbow-ring-inner" />
      <div className="pulse-core" />
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{ left: `${s.left}%`, top: `${s.top}%`, fontSize: s.size, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }}
        >
          ✦
        </span>
      ))}
      {confetti.map((c) => (
        <span
          key={c.id}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 0.6,
            backgroundColor: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            transform: `rotate(${c.rotate}deg)`,
          }}
        />
      ))}

      <p
        className="font-inter text-white/50 tracking-[0.4em] text-xs text-center mb-5 uppercase relative z-10"
        style={{ fontWeight: 600 }}
      >
        <span className="trophy-icon">🏆</span> World Champion · MetLife Stadium, New Jersey
      </p>

      <h2
        className="champion-title font-inter uppercase text-center relative z-10"
        style={{ fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 900, letterSpacing: '0.02em', marginBottom: '20px' }}
      >
        🇪🇸 SPAIN — WORLD CHAMPION
      </h2>

      <div className="flex justify-center px-4 relative z-10">
        <button
          onClick={() => setShowModal(true)}
          className="score-card bg-white rounded-xl px-8 py-5 md:px-10 md:py-6 mb-3 cursor-pointer border-0"
          style={{ borderBottom: `4px solid ${GOLD}` }}
        >
          <div className="flex items-center gap-4 md:gap-6 text-wc-black font-inter" style={{ fontWeight: 900, fontSize: 'clamp(20px, 4vw, 34px)' }}>
            <span>🇪🇸 SPAIN</span>
            <span style={{ color: '#999' }}>1 – 0</span>
            <span>ARGENTINA 🇦🇷</span>
          </div>
          <div className="font-inter text-center mt-2" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#888' }}>
            FINAL · AET · TAP FOR STATS &amp; LINEUPS
          </div>
        </button>
      </div>

      <p className="font-inter text-white/40 text-xs text-center mb-8 relative z-10">
        Ferran Torres scored in the 106th minute · Spain's 2nd title (since 2010)
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-xl mx-auto px-4 relative z-10">
        {TOURNAMENT_STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div style={{ background: '#ffffff', borderBottom: `4px solid ${s.color}`, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', padding: '14px 8px 12px' }}>
              <span className="font-inter leading-none block text-wc-black" style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900 }}>
                {s.value}
              </span>
            </div>
            <p className="font-inter text-white/60 tracking-[0.2em] text-[10px] mt-2 uppercase" style={{ fontWeight: 600 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <p className="font-inter text-white/30 text-xs text-center mt-5 tracking-widest uppercase relative z-10" style={{ fontWeight: 600 }}>
        July 19, 2026 · Spain's second title
      </p>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowModal(false)}>
          <div
            className="rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 relative"
            style={{ backgroundColor: '#111827', color: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl leading-none">
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="font-inter text-xs tracking-[0.25em] uppercase mb-2" style={{ color: '#888', fontWeight: 700 }}>
                FIFA World Cup 2026 · Final
              </div>
              <div className="font-inter" style={{ fontSize: '26px', fontWeight: 900 }}>
                🇪🇸 SPAIN 1 – 0 ARGENTINA 🇦🇷
              </div>
              <div className="font-inter text-xs mt-1" style={{ color: '#888' }}>
                AET · Ferran Torres 106' · Enzo Fernández sent off 90+3'
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-inter text-xs tracking-widest uppercase mb-3" style={{ color: '#888', fontWeight: 700 }}>
                Match Stats
              </h3>
              <div className="space-y-3">
                {MATCH_STATS.map((stat) => {
                  const total = stat.spain + stat.argentina || 1;
                  const spainPct = (stat.spain / total) * 100;
                  return (
                    <div key={stat.label}>
                      <div className="flex justify-between font-inter text-xs mb-1" style={{ color: '#ddd' }}>
                        <span>{stat.spain}{stat.note ? ` (${stat.note[0]})` : ''}</span>
                        <span style={{ color: '#888' }}>{stat.label}</span>
                        <span>{stat.argentina}{stat.note ? ` (${stat.note[1]})` : ''}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: '#2a3444' }}>
                        <div className="h-full" style={{ width: `${spainPct}%`, backgroundColor: GOLD }} />
                        <div className="h-full flex-1" style={{ backgroundColor: '#0057A8' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-inter text-xs tracking-widest uppercase mb-3" style={{ color: '#888', fontWeight: 700 }}>
                Starting Lineups
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-inter text-sm mb-2" style={{ fontWeight: 700 }}>🇪🇸 Spain (4-2-3-1)</div>
                  <ol className="font-inter text-xs space-y-1 list-decimal list-inside" style={{ color: '#ccc' }}>
                    {SPAIN_XI.map((p) => <li key={p}>{p}</li>)}
                  </ol>
                </div>
                <div>
                  <div className="font-inter text-sm mb-2" style={{ fontWeight: 700 }}>🇦🇷 Argentina (4-4-2)</div>
                  <ol className="font-inter text-xs space-y-1 list-decimal list-inside" style={{ color: '#ccc' }}>
                    {ARGENTINA_XI.map((p) => <li key={p}>{p}</li>)}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
