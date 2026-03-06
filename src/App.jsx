import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_PREFIX = "lockdown-v2";

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const uid = () => Math.random().toString(36).slice(2, 8);

function useStorage(key, defaultVal) {
  const fullKey = `${STORAGE_PREFIX}:${key}`;
  const [data, setData] = useState(defaultVal);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(fullKey);
        if (result && result.value !== undefined && result.value !== null) {
          setData(JSON.parse(result.value));
        }
      } catch {
        // Key doesn't exist yet — use default
      } finally {
        setLoaded(true);
      }
    })();
  }, [fullKey]);

  const save = useCallback((val) => {
    setData((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await window.storage.set(fullKey, JSON.stringify(next));
        } catch (e) {
          console.error("Storage save failed:", e);
        }
      }, 300);
      return next;
    });
  }, [fullKey]);

  return [data, save, loaded];
}

const PRODUCT_STAGES = [
  { id: "idea", label: "Idea & Research", icon: "💡", xp: 10, tasks: ["Define the product clearly", "Research competitors / similar products", "Estimate cost per unit", "Identify target customer"] },
  { id: "prototype", label: "Prototype", icon: "🔧", xp: 25, tasks: ["Create first physical prototype", "Test functionality", "Get 3 people's honest feedback", "Iterate based on feedback"] },
  { id: "production", label: "Production Ready", icon: "⚙️", xp: 30, tasks: ["Finalize design files / STLs", "Source all materials with costs", "Document assembly process", "Produce 5 test units"] },
  { id: "listing", label: "Listed & Live", icon: "🛒", xp: 25, tasks: ["Shoot product photos (5+ angles)", "Write product description", "Set pricing (cost + margin)", "Add to website with payment"] },
  { id: "marketing", label: "Marketing Push", icon: "📣", xp: 30, tasks: ["Create 3 reels / content pieces", "Post on Instagram", "Share in 3 relevant communities", "Get first 5 orders"] },
  { id: "shipped", label: "Shipped & Reviewed", icon: "🚀", xp: 50, tasks: ["Fulfill all initial orders", "Get 3 customer reviews", "Document lessons learned", "Decide: scale or sunset?"] },
];
const TOTAL_STAGE_XP = PRODUCT_STAGES.reduce((a, s) => a + s.xp, 0);

const LEVELS = [
  { level: 1, title: "Dreamer", xpNeeded: 0, slots: 2, color: "#666" },
  { level: 2, title: "Tinkerer", xpNeeded: 50, slots: 3, color: "#f59e0b" },
  { level: 3, title: "Builder", xpNeeded: 150, slots: 4, color: "#3b82f6" },
  { level: 4, title: "Maker", xpNeeded: 350, slots: 5, color: "#8b5cf6" },
  { level: 5, title: "Shipper", xpNeeded: 600, slots: 6, color: "#10b981" },
  { level: 6, title: "Operator", xpNeeded: 1000, slots: 8, color: "#ef4444" },
  { level: 7, title: "Mogul", xpNeeded: 1500, slots: 10, color: "#f59e0b" },
];

const DEFAULT_ROUTINE = [
  { id: "wake", time: "06:00", label: "Wake up — no phone for 10 min", block: "morning", xp: 2 },
  { id: "make", time: "06:10", label: "MAKE — Production / product work", block: "morning", duration: "20 min", xp: 5 },
  { id: "market", time: "06:30", label: "MARKET — 1 reel / 1 post / 1 DM", block: "morning", duration: "20 min", xp: 5 },
  { id: "ops", time: "06:50", label: "OPS — Orders, costs, inventory", block: "morning", duration: "20 min", xp: 3 },
  { id: "sync", time: "13:00", label: "Lunch sync with Mrigank (10 min)", block: "day", xp: 3 },
  { id: "study", time: "19:30", label: "Study / Learn (30 min)", block: "evening", duration: "30 min", xp: 5 },
  { id: "evening", time: "20:00", label: "Product / content batch (30 min)", block: "evening", duration: "30 min", xp: 5 },
  { id: "plan", time: "22:30", label: "Write tomorrow's ONE task", block: "night", xp: 2 },
];

const STUDY_TOPICS = ["Electronics / Circuits", "3D Printing / CAD", "Marketing / SEO", "Business / Finance", "Web Dev / New Tech", "Product Design", "Other"];

const WEEK_PLAN = {
  Mon: { focus: "Production Sprint", desc: "Print / assemble units", icon: "⚙️" },
  Tue: { focus: "Content Day", desc: "Shoot reels, edit content", icon: "📸" },
  Wed: { focus: "Marketing Push", desc: "Post, engage, DM prospects", icon: "📣" },
  Thu: { focus: "Operations", desc: "Ship orders, restock", icon: "📦" },
  Fri: { focus: "Website & Listings", desc: "Photos, descriptions, UX", icon: "💻" },
  Sat: { focus: "Review & Strategy", desc: "Weekly sync, review numbers", icon: "📊" },
  Sun: { focus: "Study / Rest", desc: "Learn something or recharge", icon: "📚" },
};

const TEAM = [
  { name: "You", role: "Production + Website + Content", color: "#f59e0b" },
  { name: "Mrigank", role: "Strategy + Pricing + Decisions", color: "#3b82f6" },
  { name: "Harsh", role: "Orders + Fulfillment + Customer Comms", color: "#10b981" },
];

function getLevel(xp) { let c = LEVELS[0]; for (const l of LEVELS) { if (xp >= l.xpNeeded) c = l; } return c; }
function getNextLevel(xp) { const c = getLevel(xp); return LEVELS.find(l => l.level === c.level + 1) || null; }

function XPToast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999, padding: "12px 20px", background: "rgba(245,158,11,0.95)", color: "#000", borderRadius: 12, fontWeight: 700, fontSize: 14, fontFamily: "'Fira Code', monospace", animation: "slideIn 0.3s ease, fadeOut 0.5s ease 1.5s forwards", boxShadow: "0 8px 32px rgba(245,158,11,0.4)" }}>
      {message}
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes fadeOut { to { opacity: 0; transform: translateY(-20px); } }`}</style>
    </div>
  );
}

function LevelBadge({ xp }) {
  const level = getLevel(xp); const next = getNextLevel(xp);
  const progress = next ? (xp - level.xpNeeded) / (next.xpNeeded - level.xpNeeded) : 1;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${level.color}33, ${level.color}11)`, border: `2px solid ${level.color}55`, fontSize: 18, fontWeight: 800, color: level.color, fontFamily: "'Fira Code', monospace" }}>{level.level}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: level.color }}>{level.title}</div>
        <div style={{ width: 100, height: 4, background: "#1a1a1a", borderRadius: 2, marginTop: 4 }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: level.color, borderRadius: 2, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{xp} XP {next ? `· ${next.xpNeeded - xp} to ${next.title}` : "· MAX"}</div>
      </div>
    </div>
  );
}

function StreakBar({ dayLogs }) {
  const days = []; const today = new Date();
  for (let i = 29; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); const k = dayKey(d); const log = dayLogs[k]; const checked = log ? Object.values(log).filter(Boolean).length : 0; const total = DEFAULT_ROUTINE.length; days.push({ key: k, ratio: total > 0 ? checked / total : 0, date: d, checked, total }); }
  let streak = 0; for (let i = days.length - 1; i >= 0; i--) { if (days[i].ratio >= 0.5) streak++; else break; }
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 36, fontWeight: 700, color: streak > 0 ? "#f59e0b" : "#333" }}>{streak}</span>
        <span style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: 2 }}>day streak</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {days.map(d => (<div key={d.key} title={`${fmt(d.date)} — ${d.checked}/${d.total}`} style={{ width: 13, height: 13, borderRadius: 3, background: d.ratio === 0 ? "#111" : d.ratio < 0.5 ? "#44290a" : d.ratio < 1 ? "#92600a" : "#f59e0b", border: d.key === dayKey() ? "2px solid #fff" : "1px solid #1a1a1a", transition: "transform 0.15s", cursor: "default" }} onMouseEnter={e => e.target.style.transform = "scale(1.5)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />))}
      </div>
    </div>
  );
}

function RoutineChecklist({ checks, onToggle }) {
  const blocks = { morning: "⚡ 6 AM Power Hour", day: "🏢 Office", evening: "🌙 Evening", night: "📝 Before Bed" };
  const grouped = {}; DEFAULT_ROUTINE.forEach(item => { if (!grouped[item.block]) grouped[item.block] = []; grouped[item.block].push(item); });
  return (
    <div>
      {Object.entries(grouped).map(([block, items]) => (
        <div key={block} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, fontFamily: "'Fira Code', monospace" }}>{blocks[block]}</div>
          {items.map(item => { const done = checks[item.id]; return (
            <div key={item.id} onClick={() => onToggle(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 3, borderRadius: 8, cursor: "pointer", transition: "all 0.15s", background: done ? "rgba(245,158,11,0.06)" : "transparent", border: done ? "1px solid rgba(245,158,11,0.15)" : "1px solid #111" }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: done ? "2px solid #f59e0b" : "2px solid #282828", background: done ? "#f59e0b" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>{done && <span style={{ color: "#000", fontSize: 12, fontWeight: 800 }}>✓</span>}</div>
              <span style={{ flex: 1, fontSize: 13, color: done ? "#888" : "#ccc", textDecoration: done ? "line-through" : "none" }}>{item.label}</span>
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: done ? "#f59e0b" : "#282828" }}>+{item.xp}xp</span>
            </div>
          ); })}
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product, onUpdateTask, onUpdateBlocker, onArchive }) {
  const [expanded, setExpanded] = useState(false);
  const currentStageIdx = PRODUCT_STAGES.findIndex(s => s.id === product.currentStage);
  const currentStage = PRODUCT_STAGES[currentStageIdx];
  const tasksDone = product.tasks?.[product.currentStage] ? Object.values(product.tasks[product.currentStage]).filter(Boolean).length : 0;
  const totalTasks = currentStage?.tasks?.length || 0;
  const allDone = totalTasks > 0 && tasksDone === totalTasks;

  return (
    <div style={{ border: "1px solid #1a1a1a", borderRadius: 12, overflow: "hidden", marginBottom: 10, background: product.completed ? "rgba(16,185,129,0.03)" : "#0a0a0a" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>{currentStage?.icon || "✅"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: product.completed ? "#10b981" : "#e5e5e5" }}>{product.name} {product.completed && "✓"}</div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{product.completed ? "Completed!" : `${currentStage?.label} · ${tasksDone}/${totalTasks} tasks`}</div>
        </div>
        {!product.completed && (
          <div style={{ width: 80 }}>
            <div style={{ width: "100%", height: 4, background: "#1a1a1a", borderRadius: 2 }}>
              <div style={{ width: `${((currentStageIdx + tasksDone / Math.max(totalTasks, 1)) / PRODUCT_STAGES.length) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 9, color: "#444", textAlign: "right", marginTop: 2, fontFamily: "'Fira Code', monospace" }}>{Math.round(((currentStageIdx + tasksDone / Math.max(totalTasks, 1)) / PRODUCT_STAGES.length) * 100)}%</div>
          </div>
        )}
        <span style={{ color: "#333", fontSize: 12, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </div>

      {expanded && !product.completed && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {PRODUCT_STAGES.map((s, i) => (<div key={s.id} style={{ flex: 1, height: 6, borderRadius: 3, background: i < currentStageIdx ? "#f59e0b" : i === currentStageIdx ? "#92600a" : "#111" }} title={s.label} />))}
          </div>
          <div style={{ fontSize: 11, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontFamily: "'Fira Code', monospace" }}>{currentStage?.icon} {currentStage?.label} — +{currentStage?.xp}xp on completion</div>
          {currentStage?.tasks.map((task, i) => { const done = product.tasks?.[product.currentStage]?.[i]; return (
            <div key={i} onClick={() => onUpdateTask(product.id, product.currentStage, i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", marginBottom: 2, borderRadius: 6, cursor: "pointer", background: done ? "rgba(245,158,11,0.05)" : "transparent" }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: done ? "2px solid #f59e0b" : "2px solid #222", background: done ? "#f59e0b" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{done && <span style={{ color: "#000", fontSize: 11, fontWeight: 800 }}>✓</span>}</div>
              <span style={{ fontSize: 13, color: done ? "#666" : "#bbb", textDecoration: done ? "line-through" : "none" }}>{task}</span>
            </div>
          ); })}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: "#ef4444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>What's blocking this?</div>
            <input type="text" value={product.blocker || ""} placeholder="e.g. waiting for filament delivery..." onChange={e => onUpdateBlocker(product.id, e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #1a1a1a", background: "#050505", color: "#e5e5e5", fontSize: 12, outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#ef4444"} onBlur={e => e.target.style.borderColor = "#1a1a1a"} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {allDone && (<button onClick={() => onArchive(product.id, "advance")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", fontWeight: 700, fontSize: 13, fontFamily: "'Fira Code', monospace" }}>{currentStageIdx === PRODUCT_STAGES.length - 1 ? "✅ Complete Product" : `→ Advance to ${PRODUCT_STAGES[currentStageIdx + 1]?.label}`}</button>)}
            <button onClick={() => { if (confirm("Archive this product?")) onArchive(product.id, "archive"); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #222", background: "transparent", color: "#444", fontSize: 12, cursor: "pointer" }}>Archive</button>
          </div>
        </div>
      )}
      {expanded && product.completed && (<div style={{ padding: "0 16px 16px", fontSize: 13, color: "#666" }}>Completed on {product.completedAt} · Earned {TOTAL_STAGE_XP} XP total</div>)}
    </div>
  );
}

function ProductPipeline({ products, maxSlots, onAdd, onUpdateTask, onUpdateBlocker, onArchive }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const active = products.filter(p => !p.completed && !p.archived);
  const completed = products.filter(p => p.completed);
  const locked = active.length >= maxSlots;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 2, fontFamily: "'Fira Code', monospace" }}>🏭 Product Pipeline</div>
        <div style={{ fontSize: 11, color: locked ? "#ef4444" : "#555", fontFamily: "'Fira Code', monospace" }}>{active.length}/{maxSlots} slots</div>
      </div>
      {active.map(p => (<ProductCard key={p.id} product={p} onUpdateTask={onUpdateTask} onUpdateBlocker={onUpdateBlocker} onArchive={onArchive} />))}
      {!locked ? (
        showAdd ? (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Product name..." onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { onAdd(newName.trim()); setNewName(""); setShowAdd(false); } }} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #f59e0b", background: "#0a0a0a", color: "#e5e5e5", fontSize: 13, outline: "none" }} />
            <button onClick={() => { if (newName.trim()) { onAdd(newName.trim()); setNewName(""); setShowAdd(false); } }} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #222", background: "transparent", color: "#555", fontSize: 13, cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <div onClick={() => setShowAdd(true)} style={{ padding: "14px", borderRadius: 10, border: "2px dashed #1a1a1a", textAlign: "center", color: "#333", fontSize: 13, cursor: "pointer", marginTop: 8, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#333"; }}>+ Add Product ({maxSlots - active.length} slots free)</div>
        )
      ) : (
        <div style={{ padding: "14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)", textAlign: "center", color: "#ef4444", fontSize: 12, marginTop: 8, fontFamily: "'Fira Code', monospace" }}>🔒 All slots full — complete or archive a product to unlock</div>
      )}
      {completed.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "#333", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontFamily: "'Fira Code', monospace" }}>✅ Completed ({completed.length})</div>
          {completed.map(p => (<ProductCard key={p.id} product={p} onUpdateTask={onUpdateTask} onUpdateBlocker={onUpdateBlocker} onArchive={onArchive} />))}
        </div>
      )}
    </div>
  );
}

function StudyTracker({ logs, onLog }) {
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const today = dayKey();
  const todayLogs = logs.filter(l => l.date === today);
  const thisWeek = logs.filter(l => (new Date() - new Date(l.date)) / 86400000 < 7);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontFamily: "'Fira Code', monospace" }}>📚 Study Log</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {STUDY_TOPICS.map(t => (<span key={t} onClick={() => setTopic(t)} style={{ padding: "5px 10px", borderRadius: 12, fontSize: 11, cursor: "pointer", background: topic === t ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.02)", border: topic === t ? "1px solid #3b82f6" : "1px solid #151515", color: topic === t ? "#3b82f6" : "#555", transition: "all 0.15s" }}>{t}</span>))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="What did you learn?" onKeyDown={e => { if (e.key === "Enter" && topic && note.trim()) { onLog({ topic, note: note.trim(), date: today, id: uid() }); setNote(""); } }} style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #1a1a1a", background: "#050505", color: "#e5e5e5", fontSize: 12, outline: "none" }} />
        <button onClick={() => { if (topic && note.trim()) { onLog({ topic, note: note.trim(), date: today, id: uid() }); setNote(""); } }} disabled={!topic || !note.trim()} style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: topic && note.trim() ? "#3b82f6" : "#151515", color: topic && note.trim() ? "#fff" : "#333", fontSize: 12, cursor: topic && note.trim() ? "pointer" : "default" }}>Log</button>
      </div>
      {todayLogs.length > 0 && (<div style={{ marginTop: 10 }}>{todayLogs.map(l => (<div key={l.id} style={{ fontSize: 12, color: "#666", padding: "4px 0", display: "flex", gap: 8 }}><span style={{ color: "#3b82f6", fontFamily: "'Fira Code', monospace", fontSize: 10, minWidth: 90 }}>{l.topic}</span><span>{l.note}</span></div>))}</div>)}
      <div style={{ fontSize: 10, color: "#333", marginTop: 8 }}>{thisWeek.length} entries this week · {logs.length} total</div>
    </div>
  );
}

function QuickNote({ note, onSave }) {
  const [text, setText] = useState(note);
  useEffect(() => setText(note), [note]);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontFamily: "'Fira Code', monospace" }}>📌 Tomorrow's ONE task</div>
      <textarea value={text} onChange={e => setText(e.target.value)} onBlur={() => onSave(text)} placeholder="Be specific: 'Shoot 3 wallet photos with black background'" style={{ width: "100%", minHeight: 60, padding: 10, borderRadius: 8, border: "1px solid #1a1a1a", background: "#050505", color: "#e5e5e5", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#f59e0b"} onBlurCapture={e => e.target.style.borderColor = "#1a1a1a"} />
    </div>
  );
}

function TodayFocus() {
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const plan = WEEK_PLAN[dayName] || WEEK_PLAN.Sun;
  return (
    <div style={{ padding: "14px 16px", borderRadius: 10, marginBottom: 20, background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, transparent 100%)", border: "1px solid rgba(245,158,11,0.1)" }}>
      <div style={{ fontSize: 10, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 2 }}>{dayName}'s Focus</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 2 }}>{plan.icon} {plan.focus}</div>
      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{plan.desc}</div>
    </div>
  );
}

function WeekView() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "short" });
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {days.map(d => { const isToday = d === todayName; return (
          <div key={d} style={{ padding: "6px 3px", borderRadius: 6, textAlign: "center", background: isToday ? "rgba(245,158,11,0.08)" : "transparent", border: isToday ? "1px solid rgba(245,158,11,0.2)" : "1px solid #111" }}>
            <div style={{ fontSize: 10, color: isToday ? "#f59e0b" : "#333", fontWeight: 600 }}>{d}</div>
            <div style={{ fontSize: 14, marginTop: 2 }}>{WEEK_PLAN[d]?.icon}</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

function SyncIndicator({ syncing }) {
  if (!syncing) return null;
  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 998, padding: "6px 12px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", borderRadius: 8, fontSize: 11, fontFamily: "'Fira Code', monospace" }}>
      ↑ syncing...
    </div>
  );
}

export default function App() {
  const [dayLogs, setDayLogs, dayLogsLoaded] = useStorage("day-logs", {});
  const [xp, setXp, xpLoaded] = useStorage("xp", 0);
  const [products, setProducts, productsLoaded] = useStorage("products", []);
  const [note, setNote, noteLoaded] = useStorage("tomorrow-note", "");
  const [startDate, setStartDate] = useStorage("start-date", null);
  const [studyLogs, setStudyLogs] = useStorage("study-logs", []);
  const [tab, setTab] = useState("dashboard");
  const allLoaded = dayLogsLoaded && xpLoaded && productsLoaded && noteLoaded;
  const [toast, setToast] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const today = dayKey();
  const todayChecks = dayLogs[today] || {};
  const level = getLevel(xp);
  const maxSlots = level.slots;
  const activeProducts = products.filter(p => !p.completed && !p.archived);

  const addXP = (amount, msg) => {
    setXp(prev => prev + amount);
    setToast(`+${amount} XP · ${msg}`);
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1500);
  };

  const handleRoutineToggle = (id) => {
    const wasChecked = todayChecks[id];
    setDayLogs(prev => ({ ...prev, [today]: { ...(prev[today] || {}), [id]: !wasChecked } }));
    if (!wasChecked) { const item = DEFAULT_ROUTINE.find(r => r.id === id); if (item) addXP(item.xp, item.label.split("—")[0].trim()); }
  };

  const handleAddProduct = (name) => {
    if (!startDate) setStartDate(today);
    setProducts(prev => [...prev, { id: uid(), name, currentStage: "idea", tasks: {}, blocker: "", completed: false, archived: false, createdAt: today }]);
    addXP(5, `New product: ${name}`);
  };

  const handleUpdateTask = (productId, stageId, taskIdx) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const stageTasks = { ...(p.tasks[stageId] || {}) };
      const wasChecked = stageTasks[taskIdx]; stageTasks[taskIdx] = !wasChecked;
      if (!wasChecked) addXP(3, "Task completed");
      return { ...p, tasks: { ...p.tasks, [stageId]: stageTasks } };
    }));
  };

  const handleUpdateBlocker = (productId, blocker) => { setProducts(prev => prev.map(p => p.id === productId ? { ...p, blocker } : p)); };

  const handleArchiveOrAdvance = (productId, action) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      if (action === "archive") return { ...p, archived: true };
      const curIdx = PRODUCT_STAGES.findIndex(s => s.id === p.currentStage);
      const stage = PRODUCT_STAGES[curIdx];
      if (stage) addXP(stage.xp, `${stage.label} complete!`);
      if (curIdx === PRODUCT_STAGES.length - 1) { addXP(50, `🎉 ${p.name} SHIPPED!`); return { ...p, completed: true, completedAt: today }; }
      return { ...p, currentStage: PRODUCT_STAGES[curIdx + 1].id, blocker: "" };
    }));
  };

  const handleResetAll = async () => {
    if (!confirm("Reset ALL data? This clears cross-device storage too.")) return;
    setDayLogs({});
    setXp(0);
    setProducts([]);
    setNote("");
    setStartDate(null);
    setStudyLogs([]);
    const keys = ["day-logs", "xp", "products", "tomorrow-note", "start-date", "study-logs"];
    for (const k of keys) {
      try { await window.storage.delete(`${STORAGE_PREFIX}:${k}`); } catch {}
    }
  };

  const handleStudyLog = (entry) => { setStudyLogs(prev => [...prev, entry]); addXP(5, `Studied: ${entry.topic}`); };

  const completedToday = Object.values(todayChecks).filter(Boolean).length;
  const totalTasks = DEFAULT_ROUTINE.length;
  const daysIn = startDate ? Math.floor((new Date() - new Date(startDate)) / 86400000) + 1 : 0;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "◉" },
    { id: "products", label: `Products (${activeProducts.length})`, icon: "🏭" },
    { id: "routine", label: `Routine ${completedToday}/${totalTasks}`, icon: "⚡" },
    { id: "study", label: "Study", icon: "📚" },
  ];

  if (!allLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: "#333", letterSpacing: 2 }}>LOADING FROM CLOUD...</div>
        <div style={{ width: 200, height: 2, background: "#111", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#f59e0b", borderRadius: 1, animation: "load 1s ease infinite", width: "60%" }} />
        </div>
        <style>{"@keyframes load { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }"}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#e5e5e5", fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;600;700&display=swap" rel="stylesheet" />
      {toast && <XPToast message={toast} onDone={() => setToast(null)} />}
      <SyncIndicator syncing={syncing} />

      <div style={{ padding: "20px 24px", borderBottom: "1px solid #111" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 3, fontFamily: "'Fira Code', monospace" }}>Ship or Die</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>Lockdown HQ</div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
              {fmt(new Date())} · Day {daysIn || 0}
              <span style={{ fontSize: 9, color: "#10b981", fontFamily: "'Fira Code', monospace", padding: "1px 6px", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4 }}>☁ synced</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <LevelBadge xp={xp} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 24, fontWeight: 700, color: completedToday === totalTasks ? "#10b981" : "#555" }}>{completedToday}/{totalTasks}</div>
              <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1 }}>Today</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "16px 24px 0" }}>
        {tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: tab === t.id ? "rgba(245,158,11,0.1)" : "transparent", color: tab === t.id ? "#f59e0b" : "#444", fontSize: 13, fontWeight: tab === t.id ? 600 : 400, fontFamily: "'Fira Code', monospace", transition: "all 0.15s" }}>{t.icon} {t.label}</button>))}
      </div>

      <div style={{ padding: "24px 24px 40px", maxWidth: 1100, margin: "0 auto" }}>

        {tab === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>
            <div>
              <StreakBar dayLogs={dayLogs} />
              <TodayFocus />
              {activeProducts.filter(p => p.blocker).length > 0 && (
                <div style={{ padding: 14, borderRadius: 10, marginBottom: 20, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginBottom: 6, fontFamily: "'Fira Code', monospace" }}>⚠ BLOCKED PRODUCTS</div>
                  {activeProducts.filter(p => p.blocker).map(p => (<div key={p.id} style={{ fontSize: 12, color: "#999", padding: "3px 0" }}><strong style={{ color: "#ccc" }}>{p.name}</strong>: {p.blocker}</div>))}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontFamily: "'Fira Code', monospace" }}>Active Products</div>
              {activeProducts.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#333", fontSize: 13 }}>No products yet — go to Products tab to add one</div>
              ) : activeProducts.map(p => {
                const stageIdx = PRODUCT_STAGES.findIndex(s => s.id === p.currentStage);
                const stage = PRODUCT_STAGES[stageIdx];
                const td = p.tasks?.[p.currentStage] ? Object.values(p.tasks[p.currentStage]).filter(Boolean).length : 0;
                return (
                  <div key={p.id} onClick={() => setTab("products")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 4, borderRadius: 8, border: "1px solid #111", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#222"} onMouseLeave={e => e.currentTarget.style.borderColor = "#111"}>
                    <span style={{ fontSize: 16 }}>{stage?.icon}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{p.name}</div><div style={{ fontSize: 11, color: "#444" }}>{stage?.label} · {td}/{stage?.tasks.length}</div></div>
                    {p.blocker && <span style={{ fontSize: 10, color: "#ef4444", fontFamily: "'Fira Code', monospace" }}>BLOCKED</span>}
                  </div>
                );
              })}
            </div>
            <div>
              <QuickNote note={note} onSave={setNote} />
              <WeekView />
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontFamily: "'Fira Code', monospace" }}>🤝 Team</div>
                {TEAM.map(t => (<div key={t.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} /><span style={{ fontSize: 12, color: "#999" }}><strong style={{ color: "#ccc" }}>{t.name}</strong> — {t.role}</span></div>))}
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.1)", marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#ef4444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontFamily: "'Fira Code', monospace" }}>🚫 Hard Rules</div>
                {["Complete products to unlock more slots.", "ONE platform (Instagram). No spreading.", "1 hour at 6 AM. Non-negotiable.", "Log every order & expense.", "No new equipment until 50 units sold."].map((r, i) => (<div key={i} style={{ fontSize: 12, color: "#888", padding: "3px 0" }}><span style={{ color: "#ef4444", fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>{r}</div>))}
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: "#0a0a0a", border: "1px solid #111" }}>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontFamily: "'Fira Code', monospace" }}>📊 Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[{ label: "Total XP", val: xp, color: "#f59e0b" }, { label: "Products Done", val: products.filter(p => p.completed).length, color: "#10b981" }, { label: "Study Entries", val: studyLogs.length, color: "#3b82f6" }, { label: "Slots Unlocked", val: maxSlots, color: "#8b5cf6" }].map(s => (
                    <div key={s.label} style={{ padding: 10, borderRadius: 6, background: "#050505" }}><div style={{ fontFamily: "'Fira Code', monospace", fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div><div style={{ fontSize: 10, color: "#444" }}>{s.label}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16 }}><button onClick={() => { handleResetAll() }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #151515", background: "transparent", color: "#333", fontSize: 10, cursor: "pointer", fontFamily: "'Fira Code', monospace" }}>Reset All Data</button></div>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: "#0a0a0a", border: "1px solid #111" }}>
              <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>
                Each product goes through <strong style={{ color: "#f59e0b" }}>6 stages</strong>: Idea → Prototype → Production → Listed → Marketing → Shipped.
                Complete all tasks to advance. You have <strong style={{ color: level.color }}>{maxSlots} slots</strong> at <strong style={{ color: level.color }}>{level.title}</strong> level. Earn XP to unlock more.
              </div>
            </div>
            <ProductPipeline products={products} maxSlots={maxSlots} onAdd={handleAddProduct} onUpdateTask={handleUpdateTask} onUpdateBlocker={handleUpdateBlocker} onArchive={handleArchiveOrAdvance} />
          </div>
        )}

        {tab === "routine" && (
          <div style={{ maxWidth: 600 }}>
            <StreakBar dayLogs={dayLogs} />
            <TodayFocus />
            <RoutineChecklist checks={todayChecks} onToggle={handleRoutineToggle} />
            <div style={{ marginTop: 16, fontSize: 11, color: "#333", fontFamily: "'Fira Code', monospace" }}>Daily XP available: {DEFAULT_ROUTINE.reduce((a, r) => a + r.xp, 0)} · Earned today: {DEFAULT_ROUTINE.filter(r => todayChecks[r.id]).reduce((a, r) => a + r.xp, 0)}</div>
          </div>
        )}

        {tab === "study" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: "#0a0a0a", border: "1px solid #111" }}>
              <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>Log what you study each day. Pick a topic, write what you learned. Each entry earns <strong style={{ color: "#3b82f6" }}>+5 XP</strong>.</div>
            </div>
            <StudyTracker logs={studyLogs} onLog={handleStudyLog} />
            {studyLogs.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontFamily: "'Fira Code', monospace" }}>Full History ({studyLogs.length})</div>
                {[...studyLogs].reverse().slice(0, 30).map(l => (<div key={l.id} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid #0a0a0a" }}><span style={{ fontSize: 10, color: "#333", fontFamily: "'Fira Code', monospace", minWidth: 70 }}>{l.date}</span><span style={{ fontSize: 10, color: "#3b82f6", fontFamily: "'Fira Code', monospace", minWidth: 100 }}>{l.topic}</span><span style={{ fontSize: 12, color: "#777" }}>{l.note}</span></div>))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@media (max-width: 768px) { div[style*="grid-template-columns: 1fr 320px"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
