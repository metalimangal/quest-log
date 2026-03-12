import { useState, useEffect, useCallback } from "react";

const CREATURES = [
  { id:1,  name:"Embrix",    type:"Fire",     rarity:"Common",    emoji:"🦊", color:"#FF6B35", desc:"A tiny fox spirit with a flickering tail flame." },
  { id:2,  name:"Aquabel",   type:"Water",    rarity:"Common",    emoji:"🐟", color:"#4FC3F7", desc:"A glowing fish that hums when happy." },
  { id:3,  name:"Leafkin",   type:"Grass",    rarity:"Common",    emoji:"🌿", color:"#66BB6A", desc:"A sprout creature that grows with your progress." },
  { id:4,  name:"Pebblor",   type:"Rock",     rarity:"Common",    emoji:"🪨", color:"#A0897A", desc:"A round boulder with sleepy eyes." },
  { id:5,  name:"Zapplet",   type:"Electric", rarity:"Common",    emoji:"⚡", color:"#FFD740", desc:"Crackles with static when excited." },
  { id:6,  name:"Frostine",  type:"Ice",      rarity:"Uncommon",  emoji:"❄️", color:"#80DEEA", desc:"Leaves tiny snowflakes wherever it walks." },
  { id:7,  name:"Thornix",   type:"Grass",    rarity:"Uncommon",  emoji:"🌵", color:"#AED581", desc:"A cactus knight protecting the desert." },
  { id:8,  name:"Glowtail",  type:"Psychic",  rarity:"Uncommon",  emoji:"🦋", color:"#CE93D8", desc:"Its wings pulse with soft purple light." },
  { id:9,  name:"Driftmaw",  type:"Ghost",    rarity:"Uncommon",  emoji:"👻", color:"#B39DDB", desc:"Phases through walls but always comes back." },
  { id:10, name:"Cindrak",   type:"Fire",     rarity:"Uncommon",  emoji:"🐉", color:"#FF7043", desc:"A baby dragon with hiccup-flames." },
  { id:11, name:"Luminos",   type:"Psychic",  rarity:"Rare",      emoji:"✨", color:"#F8BBD9", desc:"A star-born creature of pure light." },
  { id:12, name:"Stormwing", type:"Flying",   rarity:"Rare",      emoji:"🦅", color:"#90CAF9", desc:"Rides storm fronts across continents." },
  { id:13, name:"Voidpup",   type:"Dark",     rarity:"Rare",      emoji:"🌑", color:"#546E7A", desc:"Born from midnight shadows, fiercely loyal." },
  { id:14, name:"Crystalix", type:"Ice",      rarity:"Epic",      emoji:"💎", color:"#80CBC4", desc:"Its body refracts rainbows in sunlight." },
  { id:15, name:"Solarex",   type:"Fire",     rarity:"Epic",      emoji:"☀️", color:"#FFA726", desc:"Said to be a fragment of a small sun." },
  { id:16, name:"Abyssion",  type:"Dark",     rarity:"Legendary", emoji:"🌊", color:"#1A237E", desc:"Ancient ocean god, seen once per century." },
  { id:17, name:"Celestrix", type:"Psychic",  rarity:"Legendary", emoji:"🌟", color:"#FFD700", desc:"Weaves the fabric of dreams themselves." },
];

const RARITY_CONFIG = {
  Common:    { color:"#9E9E9E", bg:"#9E9E9E18", glow:"#9E9E9E44", weight:50, pts:10  },
  Uncommon:  { color:"#4CAF50", bg:"#4CAF5018", glow:"#4CAF5055", weight:30, pts:25  },
  Rare:      { color:"#2196F3", bg:"#2196F318", glow:"#2196F355", weight:15, pts:60  },
  Epic:      { color:"#9C27B0", bg:"#9C27B018", glow:"#9C27B066", weight:4,  pts:150 },
  Legendary: { color:"#FF9800", bg:"#FF980018", glow:"#FF980088", weight:1,  pts:400 },
};

const CATEGORIES = [
  { name:"Work",     icon:"💼", color:"#4A90D9" },
  { name:"Personal", icon:"🏠", color:"#E8A838" },
  { name:"Fitness",  icon:"💪", color:"#E85D75" },
  { name:"Study",    icon:"📚", color:"#7C4DFF" },
];

const PRIORITIES = [
  { name:"High",   color:"#E85D75", bg:"#E85D7518", pts:30 },
  { name:"Medium", color:"#E8A838", bg:"#E8A83818", pts:15 },
  { name:"Low",    color:"#52C97F", bg:"#52C97F18", pts:5  },
];

const RECURRENCE = ["None","Daily","Weekly","Monthly"];
const TODAY = new Date().toISOString().split("T")[0];

// ── GOOGLE CALENDAR LINK BUILDER (no OAuth, no credentials) ───────────────
function makeGCalLink(task) {
  if (!task.due) return null;
  const base  = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(task.title);
  let dates;
  if (task.time) {
    const start = new Date(`${task.due}T${task.time}:00`);
    const end   = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt   = d => d.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
    dates = `${fmt(start)}/${fmt(end)}`;
  } else {
    const d = task.due.replace(/-/g,"");
    dates = `${d}/${d}`;
  }
  const details = encodeURIComponent(
    `Category: ${task.category}\nPriority: ${task.priority}${task.repo ? `\nRepo: github.com/${task.repo}` : ""}`
  );
  return `${base}&text=${title}&dates=${dates}&details=${details}`;
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function rollGacha() {
  const total = Object.values(RARITY_CONFIG).reduce((s,r) => s + r.weight, 0);
  let rand = Math.random() * total, rarity = "Common";
  for (const [r, cfg] of Object.entries(RARITY_CONFIG)) {
    rand -= cfg.weight;
    if (rand <= 0) { rarity = r; break; }
  }
  const pool = CREATURES.filter(c => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };

const SAMPLE_TASKS = [
  { id:1, title:"Prepare Q2 report",         category:"Work",     priority:"High",   due:TODAY,        time:"10:00", recurring:"None",   done:false, tags:["urgent"], repo:null },
  { id:2, title:"Grocery shopping",          category:"Personal", priority:"Medium", due:TODAY,        time:"18:00", recurring:"Weekly", done:false, tags:["errands"],repo:null },
  { id:3, title:"Morning run — 5km",         category:"Fitness",  priority:"Medium", due:TODAY,        time:"07:00", recurring:"Daily",  done:true,  tags:["cardio"], repo:null },
  { id:4, title:"Read: React Deep Dive ch4", category:"Study",    priority:"Low",    due:"2026-03-15", time:"20:00", recurring:"None",   done:false, tags:["coding"], repo:null },
];

// ── FLOAT TEXT ─────────────────────────────────────────────────────────────
function FloatText({ text, color, x, y, onDone }) {
  const [op, setOp] = useState(1), [ty, setTy] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => { setOp(0); setTy(-45); }, 80);
    const t2 = setTimeout(onDone, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{
      position:"fixed", left:x, top:y, pointerEvents:"none", zIndex:9999,
      fontFamily:"'Press Start 2P',monospace", fontSize:13, color,
      fontWeight:900, transition:"opacity 0.82s,transform 0.82s",
      opacity:op, transform:`translateY(${ty}px) translateX(-50%)`,
      textShadow:`0 0 10px ${color}`
    }}>{text}</div>
  );
}

// ── GITHUB SETUP ───────────────────────────────────────────────────────────
function GitHubSetup({ token, onSave, onClose }) {
  const [val, setVal] = useState(token || "");
  const inp = {
    background:"#0f0f1e", border:"1px solid #2e2e50", borderRadius:9,
    padding:"11px 14px", color:"#e8e8f0", fontSize:13, outline:"none",
    width:"100%", boxSizing:"border-box", fontFamily:"monospace",
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:20}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"#0d0d20",border:"1px solid #2e2e50",borderRadius:20,padding:28,maxWidth:480,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <h2 style={{fontFamily:"'Press Start 2P',monospace",fontSize:11,color:"#e8e8f0",margin:0}}>🔑 GITHUB CONNECT</h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <p style={{fontSize:12,color:"#666",marginBottom:16,lineHeight:1.6}}>
          Token stored only in your browser, sent only to GitHub's API.
        </p>
        <div style={{background:"#ffffff06",border:"1px solid #1e1e38",borderRadius:12,padding:14,marginBottom:14,fontSize:11,color:"#666",lineHeight:1.9}}>
          <div style={{color:"#FFD740",fontFamily:"'Press Start 2P',monospace",fontSize:8,marginBottom:8}}>HOW TO GET A TOKEN</div>
          1. <a href="https://github.com/settings/tokens" target="_blank" style={{color:"#4A90D9"}}>github.com → Settings → Developer settings</a><br/>
          2. Personal access tokens → Tokens (classic)<br/>
          3. Generate new token → check <code style={{color:"#52C97F"}}>repo</code> scope<br/>
          4. Copy & paste below
        </div>
        <input type="password" value={val} onChange={e => setVal(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style={{...inp, marginBottom:14}} />
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid #2e2e50",background:"none",color:"#777",cursor:"pointer",fontSize:12}}>Cancel</button>
          <button onClick={() => onSave(val.trim())} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#238636,#2ea043)",color:"#fff",cursor:"pointer",fontFamily:"'Press Start 2P',monospace",fontSize:9}}>SAVE TOKEN</button>
        </div>
        {token && (
          <button onClick={() => onSave("")} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:10,border:"1px solid #E85D7533",background:"#E85D7511",color:"#E85D75",cursor:"pointer",fontSize:11}}>
            Disconnect GitHub
          </button>
        )}
      </div>
    </div>
  );
}

// ── GACHA MODAL ────────────────────────────────────────────────────────────
function GachaModal({ coins, onClose, onPull, collection }) {
  const [pulling, setPulling] = useState(false);
  const [result,  setResult]  = useState(null);
  const [shake,   setShake]   = useState(false);

  const doPull = () => {
    if (coins < 50 || pulling) return;
    setPulling(true); setResult(null); setShake(true);
    setTimeout(() => setShake(false), 600);
    setTimeout(() => {
      const r = rollGacha();
      setResult(r); onPull(r); setPulling(false);
    }, 1200);
  };

  const owned = id => collection.some(c => c.id === id);
  const rc = result ? RARITY_CONFIG[result.rarity] : null;

  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"#0d0d20",border:"1px solid #2e2e50",borderRadius:24,padding:28,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontFamily:"'Press Start 2P',monospace",fontSize:12,color:"#FFD740",margin:0,textShadow:"0 0 10px #FFD74077"}}>⚡ GACHA MACHINE</h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{
            width:140, height:140, borderRadius:24, margin:"0 auto 16px",
            background:"linear-gradient(135deg,#1a1a35,#0d0d20)",
            border:"3px solid #FFD74044", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:60, boxShadow:"0 0 30px #FFD74022",
            animation: shake ? "shake 0.5s" : pulling ? "pulse 0.4s infinite" : "none",
          }}>
            {pulling ? "🌀" : result ? result.emoji : "🎰"}
          </div>

          {result && (
            <div style={{animation:"popIn 0.5s cubic-bezier(.34,1.56,.64,1)"}}>
              <div style={{fontSize:16,color:rc.color,fontFamily:"'Press Start 2P',monospace",marginBottom:4,textShadow:`0 0 12px ${rc.glow}`}}>{result.name}</div>
              <div style={{fontSize:11,color:rc.color,marginBottom:6}}>{result.rarity} · {result.type}</div>
              <div style={{fontSize:12,color:"#888",marginBottom:8,fontStyle:"italic"}}>"{result.desc}"</div>
              {collection.filter(c => c.id === result.id).length > 1
                ? <div style={{fontSize:9,color:"#E8A838",fontFamily:"'Press Start 2P',monospace"}}>DUPLICATE +{RARITY_CONFIG[result.rarity].pts}🪙</div>
                : <div style={{fontSize:9,color:"#52C97F",fontFamily:"'Press Start 2P',monospace"}}>NEW CATCH! 🎉</div>
              }
            </div>
          )}

          <button onClick={doPull} disabled={coins < 50 || pulling} style={{
            marginTop:16, padding:"12px 32px", borderRadius:12,
            background: coins >= 50 ? "linear-gradient(135deg,#FFD740,#FF9800)" : "#333",
            border:"none", color: coins >= 50 ? "#000" : "#666",
            fontFamily:"'Press Start 2P',monospace", fontSize:10,
            cursor: coins >= 50 ? "pointer" : "not-allowed",
            boxShadow: coins >= 50 ? "0 4px 20px #FFD74055" : "none",
          }}>PULL — 50🪙</button>
          <div style={{fontSize:9,color:"#555",marginTop:8,fontFamily:"'Press Start 2P',monospace"}}>YOU HAVE {coins}🪙</div>
        </div>

        <div style={{background:"#ffffff05",borderRadius:12,padding:12,marginBottom:18}}>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"#555",marginBottom:8}}>RATES</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {Object.entries(RARITY_CONFIG).map(([r,c]) => (
              <span key={r} style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:c.bg,color:c.color,border:`1px solid ${c.color}44`}}>
                {r} {c.weight}%
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"#555",marginBottom:10}}>
            {[...new Set(collection.map(c => c.id))].length}/{CREATURES.length} COLLECTED
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {CREATURES.map(c => {
              const have = owned(c.id);
              const rc2  = RARITY_CONFIG[c.rarity];
              return (
                <div key={c.id} title={have ? `${c.name} (${c.rarity})` : "???"}
                  style={{width:40,height:40,borderRadius:9,border:`1px solid ${have ? rc2.color+"55" : "#222"}`,
                    background: have ? `radial-gradient(circle,${rc2.glow},#0a0a18)` : "#111",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize: have ? 18 : 12, filter: have ? "none" : "grayscale(1) opacity(0.2)",cursor:"help"}}>
                  {have ? c.emoji : "?"}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TASK MODAL ─────────────────────────────────────────────────────────────
function TaskModal({ form, setForm, onSave, onClose, isEdit, repos, loadingRepos }) {
  const inp = {
    background:"#0f0f1e", border:"1px solid #2e2e50", borderRadius:9,
    padding:"10px 13px", color:"#e8e8f0", fontSize:13, outline:"none",
    width:"100%", boxSizing:"border-box", fontFamily:"inherit",
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#000b",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"#13132a",border:"1px solid #2e2e50",borderRadius:18,padding:26,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontFamily:"'Press Start 2P',monospace",fontSize:10,color:"#e8e8f0",margin:0}}>
            {isEdit ? "EDIT QUEST" : "NEW QUEST"}
          </h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <input style={inp} placeholder="Quest title..." value={form.title}
            onChange={e => setForm({...form, title:e.target.value})} />

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:8,color:"#555",fontFamily:"'Press Start 2P',monospace"}}>CATEGORY</label>
              <select style={{...inp,marginTop:4}} value={form.category}
                onChange={e => setForm({...form, category:e.target.value})}>
                {CATEGORIES.map(c => <option key={c.name}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:8,color:"#555",fontFamily:"'Press Start 2P',monospace"}}>PRIORITY</label>
              <select style={{...inp,marginTop:4}} value={form.priority}
                onChange={e => setForm({...form, priority:e.target.value})}>
                {PRIORITIES.map(p => <option key={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:8,color:"#555",fontFamily:"'Press Start 2P',monospace"}}>DUE DATE</label>
              <input type="date" style={{...inp,marginTop:4}} value={form.due}
                onChange={e => setForm({...form, due:e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:8,color:"#555",fontFamily:"'Press Start 2P',monospace"}}>TIME</label>
              <input type="time" style={{...inp,marginTop:4}} value={form.time}
                onChange={e => setForm({...form, time:e.target.value})} />
            </div>
          </div>

          <div>
            <label style={{fontSize:8,color:"#555",fontFamily:"'Press Start 2P',monospace"}}>RECURRENCE</label>
            <div style={{display:"flex",gap:5,marginTop:5}}>
              {RECURRENCE.map(r => (
                <button key={r} onClick={() => setForm({...form, recurring:r})} style={{
                  flex:1, padding:"7px 0", borderRadius:8, cursor:"pointer", fontSize:9,
                  border:`1px solid ${form.recurring === r ? "#7C4DFF" : "#2e2e50"}`,
                  background: form.recurring === r ? "#7C4DFF22" : "#ffffff05",
                  color: form.recurring === r ? "#a78bfa" : "#555",
                  fontFamily:"'Press Start 2P',monospace",
                }}>{r}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{fontSize:8,color:"#238636",fontFamily:"'Press Start 2P',monospace"}}>🐙 LINK GITHUB REPO</label>
            {loadingRepos
              ? <div style={{...inp,marginTop:4,color:"#555",fontSize:12}}>Loading repos…</div>
              : repos.length > 0
                ? <select style={{...inp,marginTop:4}} value={form.repo || ""}
                    onChange={e => setForm({...form, repo:e.target.value || null})}>
                    <option value="">— No repo —</option>
                    {repos.map(r => (
                      <option key={r.full_name} value={r.full_name}>
                        {r.full_name}{r.private ? " 🔒" : ""}
                      </option>
                    ))}
                  </select>
                : <div style={{...inp,marginTop:4,color:"#555",fontSize:11}}>
                    Connect GitHub in settings to link repos
                  </div>
            }
          </div>

          <div>
            <label style={{fontSize:8,color:"#555",fontFamily:"'Press Start 2P',monospace"}}>TAGS</label>
            <input style={{...inp,marginTop:4}} placeholder="urgent, client..."
              value={form.tags} onChange={e => setForm({...form, tags:e.target.value})} />
          </div>

          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid #2e2e50",background:"none",color:"#777",cursor:"pointer",fontSize:12}}>Cancel</button>
            <button onClick={onSave} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7C4DFF,#4A90D9)",color:"#fff",cursor:"pointer",fontFamily:"'Press Start 2P',monospace",fontSize:9}}>
              {isEdit ? "SAVE CHANGES" : "ADD QUEST"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DEPLOY GUIDE ───────────────────────────────────────────────────────────
function DeployGuide({ onClose }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title:"1. CREATE GITHUB REPO", color:"#4A90D9", content:
      <><p>Go to <a href="https://github.com/new" target="_blank" style={{color:"#4A90D9"}}>github.com/new</a> and create a <strong>private repo</strong> named <code>quest-log</code>.</p></> },
    { title:"2. EXPORT & PUSH CODE", color:"#7C4DFF", content:
      <><p>Save the app as <code>src/App.jsx</code> in a Vite React project, then:</p>
      <pre style={{background:"#0a0a18",padding:12,borderRadius:8,fontSize:11,color:"#52C97F",overflowX:"auto"}}>{`npm create vite@latest . -- --template react\nnpm install\nnpm install gh-pages --save-dev\ngit init && git add .\ngit commit -m "init"\ngit remote add origin https://github.com/YOU/quest-log.git\ngit push -u origin main\nnpm run deploy`}</pre></> },
    { title:"3. ENABLE GITHUB PAGES", color:"#52C97F", content:
      <><p>Repo → <strong>Settings → Pages</strong> → Source: <strong>gh-pages branch</strong>. Live at <code style={{color:"#52C97F"}}>https://YOUR-NAME.github.io/quest-log</code></p></> },
    { title:"4. GOOGLE CALENDAR", color:"#4285F4", content:
      <><p>No setup needed! Every task with a due date has a <strong style={{color:"#4285F4"}}>📅 Add to GCal</strong> button. Click it and Google Calendar opens with everything pre-filled. Just hit Save in Google Calendar.</p></> },
  ];
  const s = steps[step];
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,padding:20}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{background:"#0d0d20",border:"1px solid #2e2e50",borderRadius:20,padding:28,maxWidth:520,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{fontFamily:"'Press Start 2P',monospace",fontSize:10,color:"#FFD740",margin:0}}>🚀 DEPLOY GUIDE</h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {steps.map((st,i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              flex:1, height:4, borderRadius:99, cursor:"pointer", transition:"background 0.3s",
              background: i === step ? st.color : i < step ? "#333" : "#1a1a30",
            }} />
          ))}
        </div>
        <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:s.color,marginBottom:12}}>{s.title}</div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.9,marginBottom:20}}>{s.content}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={() => setStep(i => Math.max(0,i-1))} disabled={step===0}
            style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid #2e2e50",background:"none",color:step===0?"#333":"#777",cursor:step===0?"not-allowed":"pointer",fontSize:12}}>← Back</button>
          {step < steps.length - 1
            ? <button onClick={() => setStep(i => i+1)} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${s.color},${steps[step+1].color})`,color:"#fff",cursor:"pointer",fontFamily:"'Press Start 2P',monospace",fontSize:9}}>NEXT →</button>
            : <button onClick={onClose} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#52C97F,#4A90D9)",color:"#fff",cursor:"pointer",fontFamily:"'Press Start 2P',monospace",fontSize:9}}>DONE ✓</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [tasks,       setTasks]       = useState(() => load("ql_tasks", SAMPLE_TASKS));
  const [xp,          setXp]          = useState(() => load("ql_xp", 0));
  const [level,       setLevel]       = useState(() => load("ql_level", 1));
  const [coins,       setCoins]       = useState(() => load("ql_coins", 100));
  const [collection,  setCollection]  = useState(() => load("ql_col", []));
  const [streak,      setStreak]      = useState(() => load("ql_streak", 0));
  const [ghToken,     setGhToken]     = useState(() => load("ql_ghtoken", ""));
  const [ghRepos,     setGhRepos]     = useState([]);
  const [ghUser,      setGhUser]      = useState(() => load("ql_ghuser", null));
  const [loadingRepos,setLoadingRepos]= useState(false);
  const [floats,      setFloats]      = useState([]);
  const [tab,         setTab]         = useState("quests");
  const [showGacha,   setShowGacha]   = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [showGhSetup, setShowGhSetup] = useState(false);
  const [showDeploy,  setShowDeploy]  = useState(false);
  const [form,        setForm]        = useState({title:"",category:"Work",priority:"Medium",due:"",time:"",recurring:"None",tags:"",repo:null});
  const [editId,      setEditId]      = useState(null);
  const [catFilter,   setCatFilter]   = useState("All");
  const [priFilter,   setPriFilter]   = useState("All");
  const [search,      setSearch]      = useState("");
  const [notification,setNotification]= useState(null);

  useEffect(() => { save("ql_tasks",    tasks);  }, [tasks]);
  useEffect(() => { save("ql_xp",       xp);
                    save("ql_level",    level);  }, [xp, level]);
  useEffect(() => { save("ql_coins",    coins);  }, [coins]);
  useEffect(() => { save("ql_col",      collection); }, [collection]);
  useEffect(() => { save("ql_streak",   streak); }, [streak]);
  useEffect(() => { save("ql_ghtoken",  ghToken);
                    save("ql_ghuser",   ghUser); }, [ghToken, ghUser]);

  const showNotif = (msg, color="#52C97F") => {
    setNotification({msg, color});
    setTimeout(() => setNotification(null), 3000);
  };

  // GitHub repos fetch
  useEffect(() => {
    if (!ghToken) { setGhRepos([]); setGhUser(null); return; }
    setLoadingRepos(true);
    Promise.all([
      fetch("https://api.github.com/user",
        {headers:{Authorization:`token ${ghToken}`}}).then(r => r.json()),
      fetch("https://api.github.com/user/repos?per_page=100&sort=updated",
        {headers:{Authorization:`token ${ghToken}`}}).then(r => r.json()),
    ]).then(([user, repos]) => {
      if (user.login) { setGhUser(user); setGhRepos(Array.isArray(repos) ? repos : []); }
      else            { setGhUser(null); setGhRepos([]); }
      setLoadingRepos(false);
    }).catch(() => setLoadingRepos(false));
  }, [ghToken]);

  const addFloat = (text, color, e) => {
    const id = Date.now() + Math.random();
    const x  = e?.clientX ?? window.innerWidth  / 2;
    const y  = e?.clientY ?? window.innerHeight / 2;
    setFloats(f => [...f, {id, text, color, x, y}]);
  };

  const awardXP = (amount, coinAmt, e) => {
    addFloat(`+${amount} XP`, "#FFD740", e);
    if (coinAmt > 0) setTimeout(() => addFloat(`+${coinAmt}🪙`, "#FF9800", e), 280);
    setXp(prev => {
      let nx = prev + amount, nl = level;
      while (nx >= nl * 100) { nx -= nl * 100; nl++; addFloat("LEVEL UP! 🎉", "#7C4DFF", e); }
      setLevel(nl);
      return nx;
    });
    setCoins(c => c + coinAmt);
  };

  const toggleDone = (id, e) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const wasDone = task.done;
    setTasks(ts => ts.map(t => t.id === id ? {...t, done:!t.done} : t));
    if (!wasDone) {
      const pri   = PRIORITIES.find(p => p.name === task.priority) || PRIORITIES[1];
      const bonus = task.due === TODAY ? 10 : 0;
      awardXP(pri.pts + bonus, Math.floor((pri.pts + bonus) / 3), e);
      setStreak(s => s + 1);
    } else {
      setStreak(s => Math.max(0, s - 1));
    }
  };

  const saveTask = () => {
    if (!form.title.trim()) return;
    const parsed = {...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean)};
    if (editId !== null) {
      setTasks(ts => ts.map(t => t.id === editId ? {...t, ...parsed} : t));
    } else {
      setTasks(ts => [...ts, {...parsed, id:Date.now(), done:false}]);
    }
    setShowModal(false);
    setEditId(null);
  };

  const openEdit = task => {
    setForm({
      title:     task.title,
      category:  task.category,
      priority:  task.priority,
      due:       task.due    || "",
      time:      task.time   || "",
      recurring: task.recurring || "None",
      tags:      (task.tags || []).join(","),
      repo:      task.repo   || null,
    });
    setEditId(task.id);
    setShowModal(true);
  };

  const onGachaPull = creature => {
    setCoins(c => c - 50);
    const isDupe = collection.some(c => c.id === creature.id);
    if (isDupe) setCoins(c => c + RARITY_CONFIG[creature.rarity].pts);
    setCollection(col => [...col, creature]);
  };

  const filtered = tasks.filter(t => {
    const s = search.toLowerCase();
    return (
      (catFilter === "All" || t.category === catFilter) &&
      (priFilter === "All" || t.priority === priFilter) &&
      (t.title.toLowerCase().includes(s) ||
       (t.tags  || []).some(g => g.includes(s)) ||
       (t.repo  || "").toLowerCase().includes(s))
    );
  });

  const overdue   = filtered.filter(t => !t.done && t.due && t.due < TODAY);
  const todayList = filtered.filter(t => !t.done && t.due === TODAY);
  const upcoming  = filtered.filter(t => !t.done && (!t.due || t.due > TODAY));
  const done      = filtered.filter(t =>  t.done);
  const xpNeeded  = level * 100;
  const pct       = Math.min((xp / xpNeeded) * 100, 100);
  const uniqueOwned = [...new Set(collection.map(c => c.id))].length;

  // ── TASK CARD ────────────────────────────────────────────────────────────
  const TaskCard = ({ task }) => {
    const cat       = CATEGORIES.find(c => c.name === task.category) || CATEGORIES[0];
    const pri       = PRIORITIES.find(p => p.name === task.priority) || PRIORITIES[1];
    const isOverdue = !task.done && task.due && task.due < TODAY;
    const repoShort = task.repo ? task.repo.split("/")[1] : null;
    const gcalLink  = makeGCalLink(task);

    return (
      <div style={{
        background:   task.done ? "#12122a" : "#1c1c35",
        border:      `1px solid ${isOverdue ? "#E85D7533" : task.done ? "#1a1a30" : cat.color+"33"}`,
        borderLeft:  `3px solid ${task.done ? "#2a2a45" : isOverdue ? "#E85D75" : cat.color}`,
        borderRadius: 12, padding:"12px 14px", marginBottom:7,
        opacity: task.done ? 0.5 : 1, transition:"all 0.2s",
      }}>
        <div style={{display:"flex",alignItems:"flex-start",gap:11}}>
          <button onClick={e => toggleDone(task.id, e)} style={{
            width:22, height:22, borderRadius:"50%",
            border:`2px solid ${task.done ? cat.color : "#444"}`,
            background: task.done ? cat.color : "transparent",
            flexShrink:0, marginTop:2, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", fontSize:11, fontWeight:900, transition:"all 0.2s",
          }}>{task.done ? "✓" : ""}</button>

          <div style={{flex:1,minWidth:0}}>
            {/* Title row */}
            <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:6,marginBottom:5}}>
              <span style={{fontSize:14,fontWeight:600,color:task.done?"#555":"#e8e8f0",textDecoration:task.done?"line-through":"none"}}>
                {task.title}
              </span>
              <span style={{fontSize:9,padding:"2px 8px",borderRadius:20,background:pri.bg,color:pri.color,fontWeight:700,border:`1px solid ${pri.color}44`}}>
                {task.priority}
              </span>
              <span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"#FFD74018",color:"#FFD740",border:"1px solid #FFD74033"}}>
                +{pri.pts}{task.due === TODAY ? "+10" : ""} XP
              </span>
              {task.recurring !== "None" && (
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"#ffffff08",color:"#777"}}>
                  ↺ {task.recurring}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:11,color:cat.color+"bb"}}>{cat.icon} {task.category}</span>
              {task.due && (
                <span style={{fontSize:11,color:isOverdue?"#E85D75":"#555"}}>
                  {isOverdue ? "⚠ " : ""}{task.due}{task.time ? " · " + task.time : ""}
                </span>
              )}
              {repoShort && (
                <a href={`https://github.com/${task.repo}`} target="_blank" rel="noreferrer"
                  style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#238636",color:"#fff",textDecoration:"none",fontWeight:600,border:"1px solid #2ea04366",display:"flex",alignItems:"center",gap:4}}>
                  🐙 {repoShort}
                </a>
              )}
              {gcalLink && (
                <a href={gcalLink} target="_blank" rel="noreferrer"
                  style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#4285F418",color:"#4285F4",textDecoration:"none",fontWeight:600,border:"1px solid #4285F433",display:"flex",alignItems:"center",gap:3}}>
                  📅 Add to GCal
                </a>
              )}
              {(task.tags || []).map(tag => (
                <span key={tag} style={{fontSize:10,color:"#444"}}>#{tag}</span>
              ))}
            </div>
          </div>

          <div style={{display:"flex",gap:4,flexShrink:0}}>
            <button onClick={() => openEdit(task)}
              style={{background:"#ffffff08",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",color:"#777",fontSize:12}}>✏</button>
            <button onClick={() => setTasks(ts => ts.filter(t => t.id !== task.id))}
              style={{background:"#E85D7511",border:"none",borderRadius:7,padding:"5px 8px",cursor:"pointer",color:"#E85D75",fontSize:12}}>✕</button>
          </div>
        </div>
      </div>
    );
  };

  // ── SECTION ──────────────────────────────────────────────────────────────
  const Section = ({ title, dot, tasks:ts }) => {
    const [open, setOpen] = useState(true);
    if (ts.length === 0) return null;
    return (
      <div style={{marginBottom:22}}>
        <button onClick={() => setOpen(o => !o)}
          style={{display:"flex",alignItems:"center",gap:7,background:"none",border:"none",cursor:"pointer",marginBottom:10,padding:0}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:dot}} />
          <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"#555",letterSpacing:2}}>{title}</span>
          <span style={{fontSize:9,color:"#444",fontFamily:"'Press Start 2P',monospace"}}>({ts.length})</span>
          <span style={{fontSize:10,color:"#444"}}>{open ? "▾" : "▸"}</span>
        </button>
        {open && ts.map(t => <TaskCard key={t.id} task={t} />)}
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#080818",color:"#e8e8f0",fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@400;600;700&display=swap');
        @keyframes popIn  { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes shake  { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(5deg)} }
        @keyframes pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes shimmer{ 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes slideDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        * { box-sizing:border-box; }
        select option { background:#0f0f1e; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0a0a18} ::-webkit-scrollbar-thumb{background:#2e2e50;border-radius:99px}
        a { color:inherit; }
      `}</style>

      {/* Floating XP texts */}
      {floats.map(f => (
        <FloatText key={f.id} text={f.text} color={f.color} x={f.x} y={f.y}
          onDone={() => setFloats(fs => fs.filter(x => x.id !== f.id))} />
      ))}

      {/* Toast */}
      {notification && (
        <div style={{
          position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
          background:"#13132a", border:`1px solid ${notification.color}55`,
          borderRadius:12, padding:"12px 20px", zIndex:9000,
          color:notification.color, fontWeight:600, fontSize:13,
          boxShadow:"0 4px 20px #00000066", animation:"slideDown 0.3s ease",
        }}>{notification.msg}</div>
      )}

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(180deg,#13132a,#080818)",borderBottom:"1px solid #1e1e38",padding:"20px 24px 16px"}}>
        <div style={{maxWidth:740,margin:"0 auto"}}>

          {/* Top row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div>
              <h1 style={{fontFamily:"'Press Start 2P',monospace",fontSize:14,color:"#FFD740",margin:0,textShadow:"0 0 12px #FFD74055"}}>⚔ QUEST LOG</h1>
              <p style={{fontSize:10,color:"#444",margin:"5px 0 0",fontFamily:"'Press Start 2P',monospace"}}>
                {new Date().toDateString().toUpperCase()}
              </p>
            </div>
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
              <a href="https://calendar.google.com" target="_blank" rel="noreferrer"
                style={{background:"#4285F418",border:"1px solid #4285F433",borderRadius:10,padding:"7px 12px",cursor:"pointer",color:"#4285F4",fontSize:11,display:"flex",alignItems:"center",gap:5,textDecoration:"none"}}>
                📅 Google Calendar
              </a>
              <button onClick={() => setShowGhSetup(true)} style={{
                background: ghUser ? "#23863622" : "#ffffff05",
                border:`1px solid ${ghUser ? "#238636" : "#2e2e50"}`,
                borderRadius:10, padding:"7px 12px", cursor:"pointer",
                color: ghUser ? "#52C97F" : "#555", fontSize:11,
                display:"flex", alignItems:"center", gap:5,
              }}>
                🐙 {ghUser ? ghUser.login : "GitHub"}
              </button>
              <button onClick={() => setShowDeploy(true)}
                style={{background:"#FFD74011",border:"1px solid #FFD74033",borderRadius:10,padding:"7px 11px",cursor:"pointer",color:"#FFD740",fontSize:11}}>
                🚀
              </button>
              <div style={{background:"#FFD74018",border:"1px solid #FFD74033",borderRadius:10,padding:"7px 12px"}}>
                <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:12,color:"#FFD740"}}>{coins}🪙</span>
              </div>
              <div style={{background:"#E85D7518",border:"1px solid #E85D7533",borderRadius:10,padding:"7px 12px"}}>
                <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:12,color:"#E85D75"}}>{streak}🔥</span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div style={{background:"#1a1a35",borderRadius:12,padding:"11px 14px",marginBottom:13}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:"#7C4DFF"}}>LVL {level}</span>
              <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:"#555"}}>{xp} / {xpNeeded} XP</span>
              <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:"#7C4DFF"}}>LVL {level+1}</span>
            </div>
            <div style={{height:10,background:"#0f0f22",borderRadius:99,overflow:"hidden"}}>
              <div style={{
                height:"100%", width:`${pct}%`,
                background:"linear-gradient(90deg,#7C4DFF,#FFD740,#7C4DFF)",
                backgroundSize:"200% 100%", animation:"shimmer 2s linear infinite",
                borderRadius:99, transition:"width 0.6s cubic-bezier(.34,1.56,.64,1)",
              }} />
            </div>
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:13}}>
            {[
              {label:"QUESTS",  value:tasks.length,                                            color:"#4A90D9"},
              {label:"TODAY",   value:tasks.filter(t=>!t.done&&t.due===TODAY).length,          color:"#7C4DFF"},
              {label:"OVERDUE", value:tasks.filter(t=>!t.done&&t.due&&t.due<TODAY).length,     color:"#E85D75"},
              {label:"DONE",    value:tasks.filter(t=>t.done).length,                          color:"#52C97F"},
            ].map(s => (
              <div key={s.label} style={{background:"#ffffff04",border:`1px solid ${s.color}22`,borderRadius:10,padding:"9px 11px"}}>
                <div style={{fontSize:20,fontWeight:700,color:s.color,fontFamily:"'Press Start 2P',monospace"}}>{s.value}</div>
                <div style={{fontSize:7,color:"#555",fontFamily:"'Press Start 2P',monospace",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search quests, #tags or repos..."
            style={{width:"100%",background:"#ffffff05",border:"1px solid #1e1e38",borderRadius:10,padding:"10px 14px",color:"#e8e8f0",fontSize:14,outline:"none"}} />
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{maxWidth:740,margin:"0 auto",padding:"0 24px"}}>

        {/* Tab bar */}
        <div style={{display:"flex",gap:4,paddingTop:16,marginBottom:4,flexWrap:"wrap"}}>
          {[["quests","⚔ QUESTS"],["collection","🎴 COLLECTION"]].map(([t,label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:"8px 16px", borderRadius:10,
              border:`1px solid ${tab===t ? "#7C4DFF" : "#1e1e38"}`,
              background: tab===t ? "#7C4DFF22" : "none",
              color: tab===t ? "#a78bfa" : "#555",
              cursor:"pointer", fontFamily:"'Press Start 2P',monospace", fontSize:8,
            }}>
              {label}{t==="collection" ? ` (${uniqueOwned}/${CREATURES.length})` : ""}
            </button>
          ))}
          <div style={{flex:1}} />
          <button onClick={() => setShowGacha(true)} style={{
            padding:"8px 14px", borderRadius:10,
            border:"1px solid #FFD74044",
            background:"linear-gradient(135deg,#FFD74022,#FF980022)",
            color:"#FFD740", cursor:"pointer",
            fontFamily:"'Press Start 2P',monospace", fontSize:8,
          }}>🎰 GACHA</button>
          <button onClick={() => {
            setForm({title:"",category:"Work",priority:"Medium",due:"",time:"",recurring:"None",tags:"",repo:null});
            setEditId(null); setShowModal(true);
          }} style={{
            padding:"8px 14px", borderRadius:10, border:"none",
            background:"linear-gradient(135deg,#7C4DFF,#4A90D9)",
            color:"#fff", cursor:"pointer",
            fontFamily:"'Press Start 2P',monospace", fontSize:8,
          }}>+ NEW</button>
        </div>

        {/* Filters */}
        {tab === "quests" && (
          <>
            <div style={{display:"flex",gap:6,paddingTop:10,paddingBottom:2,flexWrap:"wrap"}}>
              {["All", ...CATEGORIES.map(c => c.name)].map(c => {
                const cat    = CATEGORIES.find(x => x.name === c);
                const active = catFilter === c;
                return (
                  <button key={c} onClick={() => setCatFilter(c)} style={{
                    background: active ? (c==="All" ? "#ffffff12" : cat.color+"22") : "#ffffff05",
                    border:`1px solid ${active ? (c==="All" ? "#fff3" : cat.color+"77") : "#1e1e38"}`,
                    borderRadius:20, padding:"5px 11px", cursor:"pointer",
                    color: active ? (c==="All" ? "#ccc" : cat.color) : "#555",
                    fontSize:10, fontFamily:"'Press Start 2P',monospace",
                  }}>{c==="All" ? c : `${cat.icon} ${c}`}</button>
                );
              })}
              <div style={{width:1,background:"#1e1e38",margin:"0 2px"}} />
              {["All", ...PRIORITIES.map(p => p.name)].map(p => {
                const pri    = PRIORITIES.find(x => x.name === p);
                const active = priFilter === p;
                return (
                  <button key={p} onClick={() => setPriFilter(p)} style={{
                    background: active && p!=="All" ? pri.bg : active ? "#ffffff08" : "#ffffff05",
                    border:`1px solid ${active && p!=="All" ? pri.color+"55" : "#1e1e38"}`,
                    borderRadius:20, padding:"5px 11px", cursor:"pointer",
                    color: active && p!=="All" ? pri.color : active ? "#ccc" : "#555",
                    fontSize:10, fontFamily:"'Press Start 2P',monospace",
                  }}>{p}</button>
                );
              })}
            </div>

            {/* Task sections */}
            <div style={{marginTop:20}}>
              <Section title="OVERDUE"   dot="#E85D75" tasks={overdue}   />
              <Section title="TODAY"     dot="#4A90D9" tasks={todayList} />
              <Section title="UPCOMING"  dot="#7C4DFF" tasks={upcoming}  />
              <Section title="COMPLETED" dot="#52C97F" tasks={done}      />
              {filtered.length === 0 && (
                <div style={{textAlign:"center",padding:"60px 0",fontFamily:"'Press Start 2P',monospace",color:"#2a2a45",fontSize:10}}>
                  NO QUESTS FOUND<br/><br/>
                  <span style={{fontSize:8}}>add one ↗</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Collection tab */}
        {tab === "collection" && (
          <div style={{marginTop:20,paddingBottom:40}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:12}}>
              {CREATURES.map(c => {
                const have  = collection.some(x => x.id === c.id);
                const count = collection.filter(x => x.id === c.id).length;
                const rc    = RARITY_CONFIG[c.rarity];
                return (
                  <div key={c.id} style={{textAlign:"center",opacity:have?1:0.3,filter:have?"none":"grayscale(1)"}}>
                    <div style={{
                      borderRadius:14, border:`2px solid ${have ? rc.color+"77" : "#222"}`,
                      background: have ? `radial-gradient(circle at 60% 40%,${rc.glow},#0a0a18)` : "#111",
                      padding:"13px 8px 10px", position:"relative",
                    }}>
                      <div style={{fontSize:34}}>{have ? c.emoji : "?"}</div>
                      {count > 1 && (
                        <div style={{position:"absolute",top:6,right:8,fontSize:8,color:rc.color,fontFamily:"'Press Start 2P',monospace"}}>
                          x{count}
                        </div>
                      )}
                      <div style={{fontSize:8,color:have?rc.color:"#444",fontFamily:"'Press Start 2P',monospace",marginTop:5}}>
                        {have ? c.rarity : "????"}
                      </div>
                    </div>
                    <div style={{fontSize:9,color:have?"#ccc":"#444",marginTop:5,fontFamily:"'Press Start 2P',monospace",lineHeight:1.4}}>
                      {have ? c.name : "???"}
                    </div>
                    {have && <div style={{fontSize:9,color:"#666",marginTop:2}}>{c.type}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showGacha   && <GachaModal coins={coins} onClose={() => setShowGacha(false)} onPull={onGachaPull} collection={collection} />}
      {showModal   && <TaskModal  form={form} setForm={setForm} onSave={saveTask} onClose={() => { setShowModal(false); setEditId(null); }} isEdit={editId !== null} repos={ghRepos} loadingRepos={loadingRepos} />}
      {showGhSetup && <GitHubSetup token={ghToken} onSave={t => { setGhToken(t); setShowGhSetup(false); }} onClose={() => setShowGhSetup(false)} />}
      {showDeploy  && <DeployGuide onClose={() => setShowDeploy(false)} />}
    </div>
  );
}