"use strict";
/* StudyGlass v2 — POWERED BY ©Abhi \ Developers */
const CFG = window.APP_CONFIG || {};
const FB = window.firebase && CFG.firebase && CFG.firebase.apiKey ? window.firebase : null;
let auth, db;
if (FB) { FB.initializeApp(CFG.firebase); auth = FB.auth(); db = FB.firestore(); }
const ADM = (CFG.ADMIN_EMAIL || "").trim().toLowerCase();
const $ = (s, r = document) => r.querySelector(s);
const ls = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} }
};
const DAY = 864e5, COL = ["#7c5cff", "#00d4ff", "#ff3d8b", "#22d38a", "#ffb020"];
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const H = s => `<small class="h">(${s})</small>`;

/* ---------- icons ---------- */
const IC = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  study: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="3"/><path d="M7 3h12a2 2 0 012 2v12"/>',
  learn: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  daily: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  analyze: '<path d="M5 20v-7M12 20V5M19 20V9"/>',
  members: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  settings: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
};
const ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;

/* ---------- state ---------- */
const def = () => ({
  subs: [{ n: "Pure Maths", t: [] }, { n: "Applied Maths", t: [] }, { n: "Chemistry", t: [] }, { n: "Physics", t: [] }],
  cards: [], alarms: [], log: [], en: [], rd: {}, td: {}, seen: 0, rev: 0, bl: 0, pp: [], mk: [],
  set: { a: COL[0], l: 0, snd: 1, nt: 0, pen: 0, f: 25, b: 5, nm: 0, tone: "bell", vol: .6, goal: 120 }
});
let U = null, D = null, tab = "home", EDIT = false, openSub = -1, unsubs = [], DEEP = false, WL = null;
let T = { on: 0, left: 1500, mode: "f", sub: 0, end: 0, iv: 0 }, R = { show: 0 }, B = { k: "", t: "", r: null };
let SITE = ls.get("sg_site", { exam: "", label: "A/L Examination", notice: "" });
let SETS = ls.get("sg_sets", []), USERS = ls.get("sg_users", []), me = ls.get("sg_me", null);
const save = () => U && ls.set("d_" + U.email, D);
const isAdmin = () => !!U && (ADM ? U.email === ADM : (!FB && USERS[0] && USERS[0].email === U.email));
function theme() {
  const s = D ? D.set : def().set;
  document.documentElement.style.setProperty("--a", s.a);
  document.documentElement.classList.toggle("l", !!s.l);
  document.body.classList.toggle("nm", !!s.nm);
}
function toast(m) { const e = document.createElement("div"); e.className = "toast g"; e.textContent = m; document.body.append(e); setTimeout(() => e.remove(), 2400) }

/* ---------- auth ---------- */
const GSVG = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
function loginView() {
  return `<div class="login"><div class="g v"><div class="lg">${ic("cap", 64)}</div><h1>StudyGlass</h1><p>Free A/L study space</p><br>
<button class="gb" data-a="gs">${GSVG}Continue with Google</button>
${H("Google බොත්තම එබුවම phone එකේ ඔයාගේ Gmail එක තෝරන්න. පළමු වතාවට නම විතරක් අහනවා.")}
<p style="font-size:12px;margin-top:10px">Auto logout every 30 days${FB ? "" : " • Local demo mode"}</p></div></div>`;
}
function askName(pre) {
  return new Promise(res => {
    const o = document.createElement("div"); o.className = "ov";
    o.innerHTML = `<div class="g"><h2>Your name</h2>${H("ඔයාගේ නම ඇතුල් කරන්න. මේක තමයි site එකේ පෙනෙන්නේ.")}<input type="text" id="nn" value="${esc(pre)}" placeholder="Full name" style="width:100%;margin:10px 0"><button class="btn" style="width:100%">Continue</button></div>`;
    document.body.append(o);
    $("button", o).onclick = () => { const v = $("#nn", o).value.trim(); if (!v) return toast("Enter your name"); o.remove(); res(v) };
  });
}
async function gLogin() {
  if (FB) {
    try { ls.set("sg_at", Date.now()); const p = new FB.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); await auth.signInWithPopup(p) }
    catch (e) { toast("Sign-in failed: " + (e.code || e.message)) }
  } else localSheet();
}
function localSheet() {
  const o = document.createElement("div"); o.className = "ov";
  const known = USERS.map(u => `<div class="row c g" style="margin:6px 0;padding:10px;cursor:pointer" data-em="${esc(u.email)}"><div class="av" style="width:36px;height:36px">${esc((u.name || "?")[0])}</div><div>${esc(u.name)}<br><small>${esc(u.email)}</small></div></div>`).join("");
  o.innerHTML = `<div class="g"><h2>Choose a Gmail account</h2>${known}<input type="email" id="em" placeholder="name@gmail.com" style="width:100%;margin:8px 0"><div id="nw" style="display:none"><input type="text" id="nn" placeholder="Your name" style="width:100%;margin-bottom:8px"></div><div class="row sp"><button class="btn o" id="cx">Cancel</button><button class="btn" id="go">Continue</button></div>${H("Demo mode: Gmail එක type කරන්න. Real Google login සඳහා README බලන්න.")}</div>`;
  document.body.append(o);
  const fin = e => {
    e = e.trim().toLowerCase();
    if (!/^[^@\s]+@gmail\.com$/.test(e)) return toast("Enter a valid Gmail");
    let u = USERS.find(x => x.email === e);
    if (!u) { const n = $("#nn", o).value.trim(); if (!n) { $("#nw", o).style.display = "block"; return toast("Enter your name") } u = { email: e, name: n, photo: "", joined: Date.now() }; USERS.push(u); ls.set("sg_users", USERS) }
    me = { email: e, at: Date.now() }; ls.set("sg_me", me); o.remove(); U = u; enter(); toast("Welcome " + u.name);
  };
  $("#cx", o).onclick = () => o.remove();
  $("#go", o).onclick = () => fin($("#em", o).value);
  o.querySelectorAll("[data-em]").forEach(r => r.onclick = () => fin(r.dataset.em));
}
function enter() {
  D = Object.assign(def(), ls.get("d_" + U.email, {}));
  D.set = Object.assign(def().set, D.set);
  T.left = D.set.f * 60; theme(); if (FB) subscribe(); saveUser({ seen: Date.now() }); draw();
}
function logout() {
  tab = "home"; EDIT = false;
  if (FB) { unsubs.forEach(f => f()); unsubs = []; auth.signOut() }
  else { ls.set("sg_me", null); me = null; U = null; D = null; theme(); draw() }
}
function boot() {
  if (FB) {
    draw();
    auth.onAuthStateChanged(async u => {
      if (!u) { U = null; D = null; theme(); draw(); return }
      if (Date.now() - ls.get("sg_at", 0) > 30 * DAY) { await auth.signOut(); return }
      const ref = db.doc("users/" + u.uid);
      let s = null; try { s = await ref.get() } catch (e) { toast("Database error: check Firestore rules") }
      let d = s && s.exists ? s.data() : null;
      if (!d || !d.name) { const n = await askName(u.displayName || ""); d = { name: n, email: (u.email || "").toLowerCase(), photo: u.photoURL || "", joined: Date.now() }; try { await ref.set(d, { merge: true }) } catch (e) {} }
      U = Object.assign({}, d, { uid: u.uid, email: (u.email || "").toLowerCase() }); enter();
    });
  } else {
    if (me && Date.now() - me.at < 30 * DAY) { const u = USERS.find(x => x.email === me.email); if (u) { U = u; enter(); return } }
    ls.set("sg_me", null); me = null; draw();
  }
}
function subscribe() {
  unsubs.forEach(f => f()); unsubs = [];
  const err = () => {};
  unsubs.push(db.doc("site/config").onSnapshot(s => { if (s.exists) SITE = Object.assign({ exam: "", label: "A/L Examination", notice: "" }, s.data()); if (!EDIT && (tab == "home" || tab == "members")) draw() }, err));
  unsubs.push(db.collection("sets").orderBy("at", "desc").onSnapshot(s => { SETS = s.docs.map(d => Object.assign({ id: d.id }, d.data())); if (tab == "learn") draw() }, err));
  if (isAdmin()) unsubs.push(db.collection("users").onSnapshot(s => { USERS = s.docs.map(d => Object.assign({ id: d.id }, d.data())); if (tab == "members" && !EDIT) draw() }, err));
}
async function saveUser(patch) {
  Object.assign(U, patch);
  if (FB) { try { await db.doc("users/" + U.uid).set(patch, { merge: true }) } catch (e) { toast("Could not save profile") } }
  else ls.set("sg_users", USERS);
}

/* ---------- audio ---------- */
let AC;
const ac = () => { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state == "suspended") AC.resume(); return AC };
function osc(t, f, type, dur, v) { const c = ac(), o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .05) }
function alarmSound() {
  const t = ac().currentTime, k = D.set.tone, v = Math.max(.15, D.set.vol);
  for (let i = 0; i < 3; i++) {
    const x = t + i * .45;
    if (k == "beep") osc(x, 880, "square", .25, v * .3);
    else if (k == "bell") { osc(x, 660, "sine", 1, v * .5); osc(x, 1320, "sine", .6, v * .2) }
    else { osc(x, 560, "square", .3, v * .25); osc(x, 845, "square", .3, v * .25) }
  }
}
const vib = () => navigator.vibrate && navigator.vibrate([300, 150, 300]);

/* ---------- timer ---------- */
const tot = () => (T.mode == "f" ? D.set.f : D.set.b) * 60;
const fmt = s => String(s / 60 | 0).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
function tick() {
  const l = Math.max(0, Math.round((T.end - Date.now()) / 1e3)); T.left = l;
  const e = $("#tm"); if (e) { e.textContent = fmt(l); $("#rg").style.strokeDashoffset = 690 * (1 - l / tot()) }
  if (l <= 0) {
    clearInterval(T.iv); T.on = 0;
    if (T.mode == "f") { D.log.push({ d: Date.now(), s: (D.subs[T.sub] || {}).n || "General", m: D.set.f }); save(); toast("Focus complete +" + D.set.f + " min") } else toast("Break over");
    if (D.set.snd) alarmSound(); vib(); T.mode = T.mode == "f" ? "b" : "f"; T.left = tot(); draw();
  }
}
document.addEventListener("visibilitychange", () => {
  if (D && document.hidden && T.on && T.mode == "f" && D.set.pen) { T.on = 0; clearInterval(T.iv); T.left = Math.round((T.end - Date.now()) / 1e3); draw() }
});

/* ---------- alarms ---------- */
let ring = 0, fired = {};
function chk() {
  if (!D) return;
  const n = new Date(), hm = String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"), k = hm + n.getDate();
  D.alarms.forEach(a => { if (a.on && a.t == hm && fired[a.id] != k) { fired[a.id] = k; fire(a) } });
}
function fire(a) {
  if (D.set.nt && window.Notification && Notification.permission == "granted") { try { new Notification(a.l, { body: a.t }) } catch (e) {} }
  vib(); alarmSound(); clearInterval(ring); ring = setInterval(() => { alarmSound(); vib() }, 1600);
  const o = document.createElement("div"); o.className = "ov";
  o.innerHTML = `<div class="g" style="text-align:center"><div class="lg">${ic("bell", 64)}</div><h1>${esc(a.l)}</h1><h2>${a.t}</h2><button class="btn" style="width:100%">Stop</button></div>`;
  $("button", o).onclick = () => { clearInterval(ring); o.remove() }; document.body.append(o);
}

/* ---------- helpers ---------- */
const prog = s => s.t.length ? Math.round(s.t.filter(x => x.d).length / s.t.length * 100) : 0;
const mins = f => D.log.filter(f).reduce((a, x) => a + x.m, 0);
const dayk = d => new Date(d).toDateString();
function streak() { let s = 0, d = Date.now(); if (!mins(x => dayk(x.d) == dayk(d))) d -= DAY; while (mins(x => dayk(x.d) == dayk(d)) > 0) { s++; d -= DAY } return s }
const sw = (a, on, cls = "") => `<label class="sw ${cls}"><input type="checkbox" data-a="${a}" ${on ? "checked" : ""}><i></i></label>`;
function greet() { const h = new Date().getHours(); return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 16 ? "Good afternoon" : h < 19 ? "Good evening" : "Good night" }
const av = (c = "") => `<div class="av ${c}" style="${U.photo ? `background-image:url(${U.photo})` : ""}">${U.photo ? "" : esc((U.name || "?")[0].toUpperCase())}</div>`;

function cdHTML() {
  const t = SITE.exam ? new Date(SITE.exam) : null, wide = 'style="grid-column:1/-1;text-align:center;background:none;border:0"';
  if (!t || isNaN(t)) return `<div ${wide}>Exam date not set yet</div>`;
  const n = new Date(); if (t <= n) return `<div ${wide}>Exam time has arrived. Good luck!</div>`;
  const am = k => { const dm = new Date(n.getFullYear(), n.getMonth() + k + 1, 0).getDate(); return new Date(n.getFullYear(), n.getMonth() + k, Math.min(n.getDate(), dm), n.getHours(), n.getMinutes(), n.getSeconds()) };
  let tm = (t.getFullYear() - n.getFullYear()) * 12 + t.getMonth() - n.getMonth(); while (tm > 0 && am(tm) > t) tm--;
  const rem = Math.floor((t - am(tm)) / 1e3), y = Math.floor(tm / 12), mo = tm % 12, d = Math.floor(rem / 86400), h = Math.floor(rem % 86400 / 3600), mi = Math.floor(rem % 3600 / 60), s = rem % 60;
  return [["Years", y], ["Months", mo], ["Days", d], ["Hours", h], ["Minutes", mi], ["Seconds", s]].map(([l, v]) => `<div><b>${String(v).padStart(2, "0")}</b><small>${l}</small></div>`).join("") + (() => { const ms = t - n, f = x => Math.floor(x).toLocaleString(); return `<div class="tot"><div><b>${f(ms / DAY)}</b><small>Total days</small></div><div><b>${f(ms / 36e5)}</b><small>Total hours</small></div><div><b>${f(ms / 6e4)}</b><small>Total minutes</small></div></div>` })();
}
function cdCard() {
  return `<div class="g c"><div class="row sp"><p>${esc(SITE.label || "Exam")} countdown</p><span style="color:var(--a)">${ic("cal", 26)}</span></div><div class="cd" id="cd">${cdHTML()}</div>${H("විභාගයට ඉතිරි කාලය අවුරුදු, මාස, දින, පැය, මිනිත්තු, තත්පර වශයෙන් ජීවීව පෙනෙනවා.")}</div>`;
}
function xpCard() {
  const xp = mins(() => 1) * 2 + (D.rev || 0) * 5 + (D.bl || 0) * 20, lv = Math.floor(Math.sqrt(xp / 50)) + 1, lo = 50 * (lv - 1) ** 2, hi = 50 * lv * lv, LT = ["Beginner", "Explorer", "Scholar", "Achiever", "Master", "Legend"], pct = Math.round((xp - lo) / (hi - lo) * 100);
  return `<div class="g c hero"><div class="row"><div class="lvl">${lv}</div><div style="flex:1"><p>Level ${lv}</p><h2 style="margin:0">${LT[Math.min(lv - 1, 5)]}</h2></div><span style="color:var(--a)">${ic("bolt", 30)}</span></div><div class="bar" style="margin:12px 0 6px"><b style="width:${pct}%"></b></div><div class="row sp"><small>${xp - lo} / ${hi - lo} XP</small><small>${hi - xp} XP to Level ${lv + 1}</small></div>${H("Focus මිනිත්තුවකට 2 XP, card එකකට 5 XP, blurt එකකට 20 XP ලැබෙනවා.")}</div>`;
}
/* ---------- v5: advanced energy check ---------- */
const EL = [["😫", "Drained"], ["😕", "Low"], ["😐", "Okay"], ["🙂", "Good"], ["⚡", "Charged"]];
const EFAC = [["sl", "😴 Slept well"], ["wa", "💧 Hydrated"], ["fd", "🍚 Ate"], ["ex", "🏃 Moved"], ["st", "😰 Stressed"], ["cf", "☕ Caffeine"]];
const EBK = [["Morning", 5, 12], ["Afternoon", 12, 17], ["Evening", 17, 21], ["Night", 21, 29]];
const EPL = { 1: [10, "Recharge first", "Drink water, stretch or rest for 10-15 minutes, then ease in with a short review."], 2: [15, "Light session", "Keep it short and pick something you already know well."], 3: [25, "Steady session", "A normal focus block on your next best topic works well."], 4: [40, "Deep session", "Good energy: go for a longer block on a topic that matters."], 5: [50, "Peak mode", "Use this energy on your hardest or weakest topic."] };
let EF = [];
const ebk = d => { const h = new Date(d).getHours(), g = h < 5 ? h + 24 : h; return EBK.find(b => g >= b[1] && g < b[2])[0] };
const eavg = a => a.length ? a.reduce((s, x) => s + x.v, 0) / a.length : null;
const ecol = v => v < 2 ? "#ff6b81" : v < 3 ? "#ffb020" : v < 4 ? "#f4d35e" : "#22d38a";
function easyTopic() { let b = null; const ER = { 3: 0, 2: 1, 0: 2, 1: 3 }; D.subs.forEach((s, i) => s.t.forEach((x, j) => { if (x.d) return; const r = ER[x.c || 0]; if (!b || r < b.r) b = { i, j, r, s: s.n, n: x.n } })); return b }
function energyInsights(all, now) {
  const L = all.filter(x => now - x.d < 30 * DAY), out = [];
  if (L.length >= 4) {
    const bs = EBK.map(([n]) => [n, L.filter(x => ebk(x.d) == n)]).filter(b => b[1].length >= 2).map(b => [b[0], eavg(b[1])]).sort((a, b) => b[1] - a[1]);
    if (bs.length) out.push(`⏰ Your best window is ${bs[0][0]} (avg ${bs[0][1].toFixed(1)}/5). Save hard topics for then.`);
    if (bs.length > 1 && bs[bs.length - 1][1] < 2.6) out.push(`🌙 ${bs[bs.length - 1][0]} is your lowest (${bs[bs.length - 1][1].toFixed(1)}/5). Use it for cards or rest.`);
  }
  let top = null;
  EFAC.forEach(([k, l]) => { const w = L.filter(x => (x.f || []).includes(k)), o = L.filter(x => !(x.f || []).includes(k)); if (w.length >= 2 && o.length >= 2) { const df = eavg(w) - eavg(o); if (Math.abs(df) >= .5 && (!top || Math.abs(df) > Math.abs(top.df))) top = { l, df } } });
  if (top) out.push(`${top.l}: ${top.df > 0 ? "+" : ""}${top.df.toFixed(1)} energy when you tick it.`);
  return out;
}
function energyCard() {
  const all = D.en || [], now = Date.now(), tk = dayk(now), today = all.filter(x => dayk(x.d) == tk), last = today[today.length - 1] || null;
  const w7 = all.filter(x => now - x.d < 7 * DAY), p7 = all.filter(x => now - x.d >= 7 * DAY && now - x.d < 14 * DAY), a7 = eavg(w7), ap = eavg(p7);
  const bars = [6, 5, 4, 3, 2, 1, 0].map(k => { const dd = now - k * DAY, v = eavg(all.filter(x => dayk(x.d) == dayk(dd))); return `<div title="${v == null ? "No check-in" : v.toFixed(1) + "/5"}"><i style="height:${v == null ? 4 : Math.max(6, Math.round(v / 5 * 50))}px;background:${v == null ? "var(--gl1)" : ecol(v)}"></i><span style="${k == 0 ? "color:var(--a);font-weight:700" : ""}">${new Date(dd).toLocaleDateString([], { weekday: "narrow" })}</span></div>` }).join("");
  let st = 0; for (let k = last ? 0 : 1; k < 90; k++) { if (all.some(x => dayk(x.d) == dayk(now - k * DAY))) st++; else break }
  const lv = last ? last.v : 0, pl = EPL[lv], tp = lv ? (lv <= 2 ? easyTopic() : nextTopic()) : null, due = D.cards.filter(c => c.due <= now).length, ago = last ? Math.round((now - last.d) / 36e5) : 0;
  const trend = a7 != null && ap != null ? (a7 - ap >= .3 ? ` <span style="color:#22d38a">▲ ${(a7 - ap).toFixed(1)}</span>` : ap - a7 >= .3 ? ` <span style="color:#ff6b81">▼ ${(ap - a7).toFixed(1)}</span>` : " ▬") : "";
  const ins = energyInsights(all, now);
  return `<div class="g c"><div class="row sp"><h2 style="margin:0">${ic("bolt", 20)} Energy check</h2>${st ? `<small>🔥 ${st}-day streak</small>` : ""}</div>
<p style="margin:6px 0 0">How charged do you feel right now?</p>
<div class="enr">${EL.map((e, i) => `<button class="enb ${lv == i + 1 ? "on" : ""}" data-a="en${i + 1}"><b>${e[0]}</b>${e[1]}</button>`).join("")}</div>
<div>${EFAC.map(([k, l]) => `<span class="chip ${EF.includes(k) ? "on" : ""}" data-a="fx_${k}">${l}</span>`).join("")}</div>
<small>Tick what applies, then tap a level. This helps spot what boosts your energy.</small>
${last ? `<div class="row sp" style="margin-top:10px"><small>Today: ${today.map(x => new Date(x.d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " " + EL[x.v - 1][0]).join(" • ")}</small><button class="cf" data-a="enu">Undo</button></div>${ago >= 3 ? `<small>Last check-in ${ago}h ago. Tap a level to update.</small>` : ""}` : `<p style="margin-top:10px"><small>Not logged today. Log once to get a plan for right now.</small></p>`}
<div class="ec">${bars}</div>
<div class="row sp"><small>7-day average</small><b>${a7 == null ? "–" : a7.toFixed(1) + "/5"}${trend}</b></div>
${pl ? `<div class="g c notice" style="margin:10px 0 0"><small>Plan for right now</small><br><b>${pl[1]} • ${pl[0]} min</b><p style="margin:4px 0">${pl[2]}</p>${tp ? `<small>Suggested: ${esc(tp.n)} (${esc(tp.s)})</small><br>` : ""}<button class="btn" style="margin-top:8px" data-a="ef${tp ? tp.i : T.sub}_${tp ? tp.j : -1}_${pl[0]}">Start ${pl[0]}-min focus</button>${lv <= 2 && due ? ` <button class="btn o" style="margin-top:8px" data-t="cards">Review ${due} cards</button>` : ""}</div>` : ""}
${ins.length ? `<div style="margin-top:10px">${ins.map(x => `<p style="margin:4px 0;color:var(--tx)">${x}</p>`).join("")}</div>` : `<p style="margin-top:10px"><small>Log a few check-ins over several days to unlock personal insights (best time of day, what boosts you).</small></p>`}
${H("දැන් ඔයාට දැනෙන ශක්තිය තෝරන්න (ඉස්සරවෙලා නින්ද, වතුර වගේ දේවල් tick කරන්න පුළුවන්). ඒ අනුව දැන් කරන්න සුදුසු focus විනාඩි ගණන සහ topic එක පෙන්වනවා. දවස් කිහිපයක් log කළාම ඔයාගේ හොඳම වෙලාව සහ ශක්තිය වැඩි කරන දේවල් පෙන්වනවා.")}</div>`;
}

/* ---------- v3 features ---------- */
function dtSel(dis) {
  const p = (SITE.exam || "").match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/) || [], y0 = new Date().getFullYear(), M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sel = (id, from, to, cur, lab, f) => { let o = ""; for (let i = from; i <= to; i++) o += `<option value="${i}" ${cur !== "" && +cur === i ? "selected" : ""}>${f ? f(i) : String(i).padStart(2, "0")}</option>`; return `<select id="${id}" ${dis}><option value="" ${cur === "" ? "selected" : ""}>${lab}</option>${o}</select>` };
  const cy = p[1] ? +p[1] : "";
  return `<div class="row" style="margin:6px 0">${sel("xy", Math.min(y0, cy || y0), 2050, cy, "Year", i => i)}${sel("xm", 1, 12, p[2] || "", "Month", i => M[i - 1])}${sel("xd", 1, 31, p[3] || "", "Day")}${sel("xh", 0, 23, p[4] || "", "Hour")}${sel("xi", 0, 59, p[5] || "", "Min")}</div>`;
}
function dtVal() {
  const v = ["xy", "xm", "xd", "xh", "xi"].map(id => $("#" + id).value);
  if (v.every(x => x === "")) return "";
  if (v.some(x => x === "")) return null;
  const [y, m, d, h, i] = v.map(Number), t = new Date(y, m - 1, d, h, i), z = x => String(x).padStart(2, "0");
  if (t.getMonth() != m - 1 || t.getDate() != d) return null;
  return `${y}-${z(m)}-${z(d)}T${z(h)}:${z(i)}`;
}
function orbCard() {
  const tm = mins(x => dayk(x.d) == dayk(Date.now())), g = D.set.goal || 120, p = Math.min(100, Math.round(tm / g * 100));
  return `<div class="g c row" style="gap:16px"><div class="orb" style="--p:${p}"><i></i><i></i><b>${p}%</b></div><div style="flex:1"><p>Today's focus orb</p><h1>${tm} / ${g} min</h1><p>${ic("flame", 16)} ${streak()} day streak</p>${H("අද focus කරපු වෙලාව ඉලක්කයට සාපේක්ෂව orb එක පිරෙනවා. ඉලක්කය Settings වලින් වෙනස් කරන්න.")}</div></div>`;
}
function heatCard() {
  let c = "";
  for (let i = 83; i >= 0; i--) { const d = Date.now() - i * DAY, m = mins(x => dayk(x.d) == dayk(d)), o = m == 0 ? 0 : m < 30 ? .3 : m < 60 ? .55 : m < 120 ? .8 : 1; c += `<i title="${new Date(d).toDateString()}: ${m} min" style="${o ? "background:var(--a);opacity:" + o : ""}"></i>` }
  return `<div class="g c"><h2>Consistency map (12 weeks)</h2><div class="hm">${c}</div>${H("පසුගිය සති 12 තුළ හැම දවසකම ඉගෙන ගත් ප්‍රමාණය. පාට තද වෙන තරමට වැඩියෙන් ඉගෙන ගත්තා.")}</div>`;
}
function marksCard() {
  const pp = D.pp || [], avg = pp.length ? Math.round(pp.reduce((a, x) => a + x.m, 0) / pp.length) : 0, rows = pp.map((x, i) => ({ x, i })).slice(-5);
  return `<div class="g c"><h2>Past paper marks</h2>${pp.length ? `<p>Average ${avg}/100 • ${pp.length} papers</p><div class="cols">${pp.slice(-8).map(x => `<div><small>${x.m}</small><b style="height:${x.m * 1.1}px"></b>${esc(x.n.slice(0, 5))}</div>`).join("")}</div>` : "<p>No papers logged yet.</p>"}
<div class="row" style="margin-top:10px"><select id="pps">${D.subs.map(s => `<option>${esc(s.n)}</option>`).join("")}</select><input type="text" id="ppn" placeholder="Paper name" style="flex:1;min-width:90px"><input type="number" id="ppm" min="0" max="100" placeholder="/100" style="width:76px"></div><button class="btn" data-a="pa" style="margin:8px 0">Add marks</button>
${rows.map(r => `<div class="row sp" style="margin:6px 0"><span>${esc(r.x.s)} • ${esc(r.x.n)} • <b>${r.x.m}</b></span><button class="btn o" data-a="pd${r.i}">${ic("trash", 14)}</button></div>`).join("")}${H("කරපු past paper එකේ ලකුණු (100 න්) ඇතුල් කරන්න. සාමාන්‍යයයි ප්‍රස්තාරයයි පෙනෙනවා.")}</div>`;
}
function mistakeCard() {
  const mk = D.mk || [], open = mk.filter(x => !x.ok).length;
  return `<div class="g c"><h2>Mistake notebook</h2><p>${open} to fix • ${mk.length - open} mastered</p>${mk.map(x => `<div class="row sp" style="margin:8px 0"><div style="flex:1;min-width:0"><b>${esc(x.q)}</b><br><small>${esc(x.w)}${x.et ? " • " + etn(x.et) : ""}</small></div><div class="row">${sw("mk" + x.id, x.ok)}<button class="btn o" data-a="mx${x.id}">${ic("trash", 14)}</button></div></div>`).join("")}<input type="text" id="mq" placeholder="Question or topic you got wrong" style="width:100%;margin:8px 0"><input type="text" id="mw" placeholder="Correct idea / why it went wrong" style="width:100%;margin-bottom:8px"><select id="met" style="width:100%;margin-bottom:8px"><option value="">Error type (optional)</option>${ET.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select><button class="btn" data-a="ma">Add mistake</button>${H("වැරදුණු ප්‍රශ්නයයි නිවැරදි අදහසයි ලියන්න. ඒක හොඳට තේරුණාම toggle එක on කරන්න.")}</div>`;
}
function badgeCard() {
  const tt = mins(() => 1), st = streak(), L = [["First focus", tt > 0], ["3-day streak", st >= 3], ["7-day streak", st >= 7], ["10 hours focus", tt >= 600], ["50 cards reviewed", (D.rev || 0) >= 50], ["5 blurts", (D.bl || 0) >= 5], ["5 mistakes mastered", (D.mk || []).filter(x => x.ok).length >= 5], ["5 papers logged", (D.pp || []).length >= 5]];
  return `<div class="g c"><h2>Badges (${L.filter(x => x[1]).length}/${L.length})</h2>${L.map(([n, ok]) => `<span class="chip" style="${ok ? "border-color:var(--a)" : "opacity:.4"}">${n}</span>`).join("")}${H("ඉලක්ක සපුරද්දී badges ලැබෙනවා.")}</div>`;
}
function backupCard() {
  return `<div class="g c"><h2>Backup & restore</h2><div class="row"><button class="btn o" data-a="bx">Export backup</button><span class="btn o up">Import backup<input type="file" id="bi" accept=".json,application/json"></span></div>${H("Export එබුවම ඔයාගේ දත්ත file එකකට save වෙනවා. Phone එක මාරු කළාම Import කරලා ආපහු ගන්න පුළුවන්.")}</div>`;
}
function deepView() {
  return `<div class="deep"><p>${T.mode == "f" ? "Deep focus" : "Break"} • ${esc((D.subs[T.sub] || {}).n || "")}</p><div class="ring"><svg width="230" height="230"><circle cx="115" cy="115" r="110" fill="none" stroke="var(--gl1)" stroke-width="10"/><circle id="rg" cx="115" cy="115" r="110" fill="none" stroke="var(--a)" stroke-width="10" stroke-linecap="round" stroke-dasharray="690" stroke-dashoffset="${690 * (1 - T.left / tot())}" style="transition:stroke-dashoffset .5s linear"/></svg><div id="tm">${fmt(T.left)}</div></div><div class="row" style="justify-content:center"><button class="btn" data-a="tg">${T.on ? "Pause" : "Start"}</button><button class="btn o" data-a="dx">Exit</button></div></div>`;
}
async function wake(on) { try { if (on && navigator.wakeLock) WL = await navigator.wakeLock.request("screen"); else if (WL) { await WL.release(); WL = null } } catch (e) {} }

/* ---------- daily techniques ---------- */
const TQ = [
  ["Active Recall", "Roediger & Karpicke", "Close the book and write everything you remember before checking. Testing yourself beats re-reading.", "පොත වහලා මතක තියෙන හැමදේම ලියන්න, ඊට පස්සේ පොතෙන් බලන්න. නැවත නැවත කියවනවාට වඩා මේක හොඳයි."],
  ["Spaced Repetition", "Hermann Ebbinghaus", "Review a topic after a day, then a few days, then a week, then longer gaps, so you forget less.", "පාඩමක් එක දවසකට පස්සේ, ඊට පස්සේ දවස් කිහිපයකට, සතියකට, ඊට පස්සේ තවත් ගැප් වැඩි කරමින් නැවත බලන්න. එවිට අමතක වීම අඩුයි."],
  ["Feynman Technique", "Richard Feynman", "Explain the topic in simple words as if teaching a child. Where you get stuck is what you must relearn.", "පාඩම පොඩි ළමයෙකුට කියලා දෙනවා වගේ සරල වචනවලින් කියන්න. හිරවෙන තැන තමයි ආයෙත් ඉගෙනගන්න ඕන තැන."],
  ["Interleaving", "Rohrer & Taylor", "Mix different problem types in one session instead of doing twenty of the same kind in a row.", "එකම වර්ගයේ ගණන් විස්සක් එක දිගට කරනවා වෙනුවට, වෙනස් වර්ගවල ගණන් මිශ්‍ර කරලා කරන්න."],
  ["Dual Coding", "Allan Paivio", "Pair every key idea with a quick sketch or diagram next to your words.", "වැදගත් අදහසක් ලියන හැම වෙලාවකම ඒක ළඟින් පොඩි රූපයක් හෝ diagram එකක් අඳින්න."],
  ["Elaborative Interrogation", "Michael Pressley", "After each fact, ask yourself why it is true and answer in one line.", "එක fact එකක් ඉගෙනගත්තම 'ඇයි මේක ඒ විදිහට?' කියලා ඔයාගෙන්ම ඇහුවා, එක පේළියකින් උත්තර දෙන්න."],
  ["Sleep and Memory", "Matthew Walker", "Revise key points before bed and protect your sleep, because sleep helps lock memories in.", "නිදාගන්න කලින් වැදගත් කරුණු ඉක්මනින් බලන්න, ඒ වගේම හොඳට නිදාගන්න. නින්ද මතකය ශක්තිමත් කරනවා."],
  ["Desirable Difficulties", "Robert Bjork", "Choose practice that feels slightly hard. A little struggle means deeper learning.", "ටිකක් අමාරු වගේ දැනෙන පුහුණුවක් තෝරන්න. පොඩි අමාරුවක් දැනෙනවා නම් ඉගෙනීම ගැඹුරු වෙනවා."],
  ["Pretesting", "Nate Kornell", "Try questions on a new topic before studying it. Even wrong guesses help the answer stick later.", "අලුත් පාඩමක් ඉගෙනගන්න කලින් ඒකේ ප්‍රශ්න අත්හදා බලන්න. වැරදි වුණත් පස්සේ නිවැරදි උත්තරය හොඳට මතක හිටිනවා."],
  ["Deliberate Practice", "Anders Ericsson", "Pick one weak skill, practise it with full focus for a short block, get feedback, repeat.", "දුර්වලම එක කුසලතාවයක් තෝරලා, පූර්ණ අවධානයෙන් කෙටි වේලාවක් පුහුණු වෙන්න. නිවැරදි කරගෙන නැවත කරන්න."],
  ["Chunking", "George Miller", "Break long lists into small groups of about four to seven items and learn group by group.", "දිග ලැයිස්තුවක් අයිතම හතර හතේ පොඩි කොටස් වලට බෙදලා, කොටසින් කොටස ඉගෙනගන්න."],
  ["Growth Mindset", "Carol Dweck", "Replace 'I can't do this' with 'I can't do this yet' and keep going.", "'මට බෑ' කියනවා වෙනුවට 'මට තවම බෑ' කියලා කියන්න, ඉදිරියට යන්න."]
];
const V_daily = () => {
  const d = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / DAY), pick = [0, 1, 2].map(i => TQ[(d * 3 + i) % TQ.length]);
  return `<div class="v"><h1>Daily Techniques</h1><p>${new Date().toDateString()} • new cards every day</p>${H("හැම දවසකම ලෝක ප්‍රසිද්ධ විද්‍යාඥයන් කියපු ඉගෙනීමේ ක්‍රම 3ක් මෙතන අලුතින් එනවා. අද එකක් හරි අත්හදා බලන්න.")}${pick.map(x => `<div class="g c tq"><span class="chip">${esc(x[1])}</span><h2>${esc(x[0])}</h2><div>${esc(x[2])}</div><small class="h">(${esc(x[3])})</small></div>`).join("")}</div>`;
};

/* ---------- views ---------- */
function alarmUI() {
  const sug = [["05:30", "Wake up"], ["06:00", "Morning revision"], ["16:00", "Study block"], ["19:30", "Evening recall"], ["22:00", "Sleep time"]];
  return `<div class="g c"><h2>${ic("bell", 20)} Alarms</h2>${sug.map(([t, l]) => `<span class="chip" data-sg="${t}|${l}">${t} ${l}</span>`).join("")}${H("යෝජිත alarm එකක් එබුවම ඒක add වෙනවා.")}
<div class="row" style="margin-top:10px"><input type="time" id="at" value="06:00"><input type="text" id="al" placeholder="Label" style="flex:1"><button class="btn" data-a="aa">Add</button></div>${H("ඔයාගේම වෙලාවක් සහ නමක් දාලා Add කරන්න.")}
<div class="row" style="margin-top:10px"><span>Tone</span><select id="tn">${["bell", "beep", "cowbell"].map(x => `<option ${D.set.tone == x ? "selected" : ""}>${x}</option>`).join("")}</select><button class="btn o" data-a="tt">Test</button></div>
${D.alarms.map(a => `<div class="row sp" style="margin:8px 0"><div><b style="font-size:22px">${a.t}</b><br><small>${esc(a.l)}</small></div><div class="row">${sw("al" + a.id, a.on)}<button class="btn o" data-a="ad${a.id}">${ic("trash", 16)}</button></div></div>`).join("")}
${H("Alarm රිංග් වෙන්නේ app එක open (background) තියෙද්දී විතරයි. Phone එක lock කරලා ඇප් එක වැහුවොත් phone Clock app එකත් භාවිතා කරන්න.")}</div>`;
}
/* ---------- v4: Subject Studio, Missions, What's New ---------- */
const REL = [{ id: "r5", at: 1791980000000, t: "Smarter Energy check", x: "Log how you feel with factors like sleep and water, get a focus plan for right now, see your 7-day chart, best time of day and what boosts your energy. Bell and What's New now open properly." }, { id: "r4", at: 1791979200000, t: "StudyGlass v4 is here", x: "New Subject Studio: remove topics you don't need, rate how confident you feel, add syllabus topics in one tap and jump straight into focus. Plus Daily Missions and this What's New bell." }];
const TPL = { "Pure Maths": ["Algebra & Inequalities", "Functions & Graphs", "Trigonometry", "Differentiation", "Integration", "Complex Numbers", "Matrices", "Sequences & Series"], "Applied Maths": ["Vectors & Statics", "Kinematics", "Newton's Laws", "Work, Energy & Power", "Momentum & Impulse", "Projectiles", "Circular Motion", "Probability"], "Chemistry": ["Atomic Structure", "Chemical Bonding", "Mole Concept", "Thermochemistry", "Equilibrium", "Kinetics", "Electrochemistry", "Organic Chemistry"], "Physics": ["Measurements", "Mechanics", "Oscillations & Waves", "Thermal Physics", "Electrostatics", "Current Electricity", "Magnetism", "Electronics"] };
const CF = ["New", "Weak", "OK", "Strong"], RK = [1, 0, 2, 3];
const newsList = () => (SITE.news || []).concat(REL).sort((a, b) => b.at - a.at);
const unread = () => newsList().filter(x => x.at > (D.seen || 0)).length;
const bellBtn = () => { const n = unread(); return `<button class="bell" data-a="bl" aria-label="What's new">${ic("bell", 22)}${n ? `<i>${n}</i>` : ""}</button>` };
function newsSheet(seen) {
  const old = $(".ov.nw"); if (old) old.remove();
  const o = document.createElement("div"), adm = isAdmin(); o.className = "ov nw";
  o.innerHTML = `<div class="g"><div class="row sp"><h2 style="margin:0">What's new</h2><button class="btn o" data-a="nx">Close</button></div><div style="max-height:60vh;overflow:auto;margin-top:8px">${newsList().map(x => `<div class="it"><b>${x.at > seen ? '<span class="new">NEW</span> ' : ""}${esc(x.t)}</b><br><small>${new Date(x.at).toLocaleDateString()}</small><p style="margin:4px 0">${esc(x.x)}</p>${adm && String(x.id)[0] != "r" ? `<button class="btn o" data-a="nd" data-id="${x.id}">${ic("trash", 14)} Delete</button>` : ""}</div>`).join("")}</div></div>`;
  document.body.append(o);
}
function nextTopic() { let b = null; D.subs.forEach((s, i) => s.t.forEach((x, j) => { if (x.d) return; const r = RK.indexOf(x.c || 0); if (!b || r < b.r) b = { i, j, r, s: s.n, n: x.n } })); return b }
function missionCard() {
  const dk = dayk(Date.now()), M = [["Focus 30 minutes", mins(x => dayk(x.d) == dk), 30], ["Review 10 cards", (D.rd || {})[dk] || 0, 10], ["Finish 1 topic", (D.td || {})[dk] || 0, 1]], all = M.every(m => m[1] >= m[2]);
  return `<div class="g c"><h2>${ic("flame", 20)} Daily missions ${all ? "🎉" : ""}</h2>${M.map(([l, v, g]) => `<div style="margin:8px 0"><div class="row sp"><span>${v >= g ? "✓ " : ""}${l}</span><small>${Math.min(v, g)}/${g}</small></div><div class="bar"><b style="width:${Math.min(100, v / g * 100)}%"></b></div></div>`).join("")}${H("අද මෙම කාර්ය 3 ඉවර කරන්න. ඉවර වුණාම 🎉 පෙනෙනවා.")}</div>`;
}
function studio() {
  const nx = nextTopic(), td = D.subs.reduce((a, s) => a + s.t.length, 0), dn = D.subs.reduce((a, s) => a + s.t.filter(x => x.d).length, 0);
  return `<div class="g c"><div class="row sp"><h2 style="margin:0">Subject Studio</h2><small>${dn}/${td} topics done</small></div>
${nx ? `<div class="g c notice" style="margin:10px 0"><small>Next best topic</small><br><b>${esc(nx.n)}</b> <small>• ${esc(nx.s)}${nx.r == 0 ? " • marked weak" : ""}</small><br><button class="btn" style="margin-top:8px" data-a="tf${nx.i}_${nx.j}">Start focus</button></div>` : ""}
${D.subs.map((s, i) => { const m = mins(x => x.s == s.n), op = openSub == i, have = s.t.map(x => x.n), tp = (TPL[s.n] || []).filter(x => !have.includes(x)).slice(0, 6);
  return `<div style="margin:12px 0"><div class="row sp" data-o="${i}" style="cursor:pointer"><span><i class="dt" style="background:${COL[i % 5]}"></i><b>${esc(s.n)}</b><br><small>${s.t.filter(x => x.d).length}/${s.t.length} topics • ${m} min</small></span><b>${prog(s)}% ${op ? "▾" : "▸"}</b></div><div class="bar"><b style="width:${prog(s)}%"></b></div>
${op ? `<div style="margin-top:8px">${s.t.length ? "" : "<p>No topics yet. Add your own or tap a suggestion.</p>"}${s.t.map((x, j) => `<div class="row sp" style="margin:6px 0"><div class="row" style="flex:1;min-width:0">${sw("tp" + i + "_" + j, x.d)}<span style="${x.d ? "opacity:.5;text-decoration:line-through" : ""}">${esc(x.n)}</span></div><div class="row" style="gap:6px"><button class="cf cf${x.c || 0}" data-a="tc${i}_${j}">${CF[x.c || 0]}</button><button class="cf" data-a="tf${i}_${j}">${ic("study", 14)}</button><button class="cf" data-a="tx${i}_${j}">${ic("trash", 14)}</button></div></div>`).join("")}
<div class="row" style="margin-top:8px"><input type="text" id="nt${i}" placeholder="New topic (use commas for many)" style="flex:1"><button class="btn" data-a="at${i}">+</button></div>
${tp.length ? `<p style="margin:8px 0 2px"><small>Suggested syllabus topics</small></p>${tp.map(x => `<span class="chip" data-a="tm${i}_${TPL[s.n].indexOf(x)}">+ ${esc(x)}</span>`).join("")}` : ""}
${s.t.some(x => x.d) ? `<button class="btn o" style="margin-top:8px" data-a="cl${i}">Remove finished topics</button>` : ""}</div>` : ""}</div>` }).join("")}
${H("Subject එකක් එබුවම topics පෙනෙනවා. Weak/OK/Strong එබුවම ඔයාගේ විශ්වාසය වෙනස් වෙනවා. 🗑 එබුවම topic එක අයින් වෙනවා. අවශ්‍ය නැති ඒවා අයින් කරන්න පුළුවන්.")}</div>`;
}
function newsAdmin() {
  const d = EDIT ? "" : "disabled";
  return `<div class="g c"><h2>Post an update</h2><p>Everyone sees this under the bell.</p><input type="text" id="nwt" placeholder="Title (e.g. New: Past paper tracker)" ${d} style="width:100%;margin:6px 0"><input type="text" id="nwx" placeholder="What changed?" ${d} style="width:100%;margin-bottom:8px"><button class="btn" data-a="np" ${d}>Publish</button>${(SITE.news || []).length ? `<h2 style="margin-top:14px">Published updates</h2>${(SITE.news || []).map(x => `<div class="row sp it"><span style="min-width:0"><b>${esc(x.t)}</b><br><small>${new Date(x.at).toLocaleDateString()}</small></span><button class="btn o" data-a="nd" data-id="${x.id}" aria-label="Delete update">${ic("trash", 16)}</button></div>`).join("")}` : ""}${H("අලුත් දෙයක් site එකට දැම්මාම මෙතනින් ලියන්න. ළමයින්ගේ bell එකේ NEW ලෙස පෙනෙනවා. Edit mode on කරන්න.")}</div>`;
}
const saveSite = async () => { if (FB) { try { await db.doc("site/config").set(SITE, { merge: true }) } catch (er) { toast("Save failed: check rules/admin email") } } else ls.set("sg_site", SITE) };
const V = {
  home() {
    const tm = mins(x => dayk(x.d) == dayk(Date.now())), due = D.cards.filter(c => c.due <= Date.now()).length;
    return `<div class="v"><div class="row">${av()}<div><p>${greet()}</p><h1>${esc(U.name)}</h1></div></div>
${noticeCards()}
${orbCard()}${xpCard()}${cdCard()}
<div class="grid"><div class="g c"><p>This week</p><h1>${(mins(x => Date.now() - x.d < 7 * DAY) / 60).toFixed(1)} h</h1>${H("පසුගිය දවස් 7 තුළ මුළු focus පැය ගණන.")}</div>
<div class="g c"><p>Cards due</p><h1>${due}</h1><button class="btn" data-t="cards">Review</button>${H("අද බලන්න තියෙන flashcards. Review එබුවම පටන් ගන්නවා.")}</div></div>
${energyCard()}
${missionCard()}${studio()}${commCard()}</div>`;
  },
  study() {
    return `<div class="v"><h1>Focus Timer</h1><div class="g c" style="text-align:center"><div class="chip">${T.mode == "f" ? "Focus" : "Break"}</div>
<div class="ring"><svg width="230" height="230"><circle cx="115" cy="115" r="110" fill="none" stroke="var(--gl1)" stroke-width="10"/><circle id="rg" cx="115" cy="115" r="110" fill="none" stroke="var(--a)" stroke-width="10" stroke-linecap="round" stroke-dasharray="690" stroke-dashoffset="${690 * (1 - T.left / tot())}" style="transition:stroke-dashoffset .5s linear"/></svg><div id="tm">${fmt(T.left)}</div></div>
<select id="ts" style="margin:8px 0">${D.subs.map((s, i) => `<option value="${i}" ${i == T.sub ? "selected" : ""}>${esc(s.n)}</option>`).join("")}</select>
<div class="row" style="justify-content:center"><button class="btn" data-a="tg">${T.on ? "Pause" : "Start"}</button><button class="btn o" data-a="tr">Reset</button><button class="btn o" data-a="tk">Skip</button><button class="btn o" data-a="dp">Deep Focus</button></div>
${H("Subject එක තෝරලා Start එබුවම focus වෙලාව ගණන් කරනවා. අවසන් වුණාම break එකක්. වෙලාව Settings වලින් වෙනස් කරන්න. Deep Focus එබුවම screen එක ඔන් තියාගෙන වෙන දේවල් නැති timer එකක් පෙන්වනවා.")}</div></div>`;
  },
  cards() {
    const due = D.cards.filter(c => c.due <= Date.now()), c = due[0];
    return `<div class="v"><h1>Flashcards</h1><div class="g c">${c ? `<p>${esc(c.s)} • Box ${c.b + 1} • ${due.length} due</p><div class="fc g" data-a="rv">${R.show ? esc(c.a) : esc(c.q)}</div>${R.show ? `<div class="row" style="justify-content:center;margin-top:10px"><button class="btn r" data-a="r0">Again</button><button class="btn" data-a="r1">Good</button><button class="btn o" data-a="r2">Easy</button></div>` : `<p style="text-align:center">Tap the card to reveal</p>`}` : `<p>No cards due today.</p>`}${H("Card එක එබුවම උත්තරය පෙනෙනවා. අමතක වුණා නම් Again, මතක තිබුණා නම් Good, ඉතා ලේසි නම් Easy එබුවම ඊළඟ වතාව ගණනය වෙනවා.")}</div>
<div class="g c"><h2>New card</h2><select id="cs">${D.subs.map(s => `<option>${esc(s.n)}</option>`).join("")}</select><input type="text" id="cq" placeholder="Question" style="width:100%;margin:8px 0"><input type="text" id="ca" placeholder="Answer" style="width:100%;margin-bottom:8px"><button class="btn" data-a="ac">Add card</button><p>Total: ${D.cards.length} cards</p>${H("Subject එක, ප්‍රශ්නය සහ උත්තරය ලියලා Add card එබුවම අලුත් card එකක් හැදෙනවා.")}<h2 style="margin-top:14px">Bulk import</h2><textarea id="bu" rows="4" placeholder="Question | Answer (one per line)"></textarea><button class="btn" data-a="ib">Import cards</button>${H("එක පේළියකට එක card එකක්: ප්‍රශ්නය | උත්තරය ලෙස ලියලා Import එබුවම cards ගොඩක් එකවර එකතු වෙනවා.")}</div></div>`;
  },
  learn() {
    const plan = D.subs.map(s => ({ s, m: mins(x => x.s == s.n && Date.now() - x.d < 3 * DAY) })).sort((a, b) => a.m - b.m).slice(0, 3);
    return `<div class="v"><h1>Learn</h1>${lxMgr()}${lxOn("bl")?`<div class="g c"><h2>${ic("learn", 20)} Blurting</h2>
<input type="text" id="bk" placeholder="Keywords: mole, enthalpy, catalyst" value="${esc(B.k)}" style="width:100%;margin:8px 0"><textarea id="bt" rows="5" placeholder="Write everything you remember...">${esc(B.t)}</textarea><button class="btn" data-a="bc">Check</button>
${B.r ? `<p style="margin-top:10px"><b>${B.r.p}%</b> recalled</p><div>${B.r.h.map(k => `<span class="chip" style="border-color:#22d38a">✓ ${esc(k)}</span>`).join("")}${B.r.m.map(k => `<span class="chip" style="border-color:#ff4d6d">✗ ${esc(k)}</span>`).join("")}</div>` : ""}
${H("Keywords කොමා වලින් වෙන් කරලා දාන්න. පොත නොබලා මතකයෙන් ලියලා Check එබුවම මතක ආපු ඒවා ✓ ලෙසත් අමතක ඒවා ✗ ලෙසත් පෙන්වනවා.")}</div>`:""}
${lxOn("kl")?`<div class="g c"><h2>Keyword library</h2><p>Tap a set to load it into Blurting.</p>${SETS.map(s => `<span class="chip" data-a="pick" data-id="${esc(s.id)}">${esc(s.t)}</span>${isAdmin() ? `<button class="btn o" style="padding:4px 8px" data-a="sd" data-id="${esc(s.id)}">${ic("trash", 14)}</button>` : ""}`).join("") || "<p>No sets yet.</p>"}
<div class="row" style="margin-top:10px"><input type="text" id="stt" placeholder="Set title" style="flex:1"></div><input type="text" id="stk" placeholder="Keywords, comma separated" style="width:100%;margin:8px 0"><button class="btn" data-a="sa">Add to library</button>
${H("Keyword set එකක් library එකට add කරන්න පුළුවන්. Set එකක් එබුවම Blurting එකට load වෙනවා.")}</div>`:""}
${lxOn("mk")?mistakeCard():""}${lxOn("sp")?`<div class="g c"><h2>${ic("study", 20)} Smart session plan</h2>${plan.map((x, i) => { const t = x.s.t.find(y => !y.d); return `<div class="row sp" style="margin:8px 0"><div><b>${i + 1}. ${esc(x.s.n)}</b><br><small>${t ? esc(t.n) : "Practice problems"}</small></div><span class="chip">${D.set.f} min</span></div>` }).join("") || "<p>Add subjects first.</p>"}${H("පසුගිය දවස් 3 තුළ අඩුවෙන්ම ඉගෙන ගත් subjects මුලින්. එකම subject එක දිගට නොකර මාරු මාරුවට කරන්න (interleaving).")}</div>`:""}${newTools()}</div>`;
  },
  daily() { return V_daily() },
  analyze() {
    const days = [...Array(7)].map((_, i) => { const d = Date.now() - (6 - i) * DAY; return [["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][new Date(d).getDay()], mins(x => dayk(x.d) == dayk(d))] }), mx = Math.max(30, ...days.map(x => x[1])), tt = mins(() => 1);
    return `<div class="v"><h1>Analyze</h1><div class="grid"><div class="g c"><p>Total focus</p><h1>${(tt / 60).toFixed(1)} h</h1></div><div class="g c"><p>Streak</p><h1>${ic("flame", 26)} ${streak()}</h1></div><div class="g c"><p>Cards</p><h1>${D.cards.length}</h1></div></div>
<div class="g c"><h2>Last 7 days (min)</h2><div class="cols">${days.map(x => `<div><small>${x[1]}</small><b style="height:${x[1] / mx * 100}px"></b>${x[0]}</div>`).join("")}</div>${H("පසුගිය දවස් 7 තුළ දවසක් පාසා ඉගෙන ගත් මිනිත්තු ගණන.")}</div>
${heatCard()}${marksCard()}${badgeCard()}<div class="g c"><h2>By subject</h2>${D.subs.map(s => { const m = mins(x => x.s == s.n); return `<div style="margin:10px 0"><div class="row sp"><span>${esc(s.n)}</span><span>${m} min • ${prog(s)}% topics</span></div><div class="bar"><b style="width:${tt ? m / tt * 100 : 0}%"></b></div></div>` }).join("")}${H("Subject එකකට කොපමණ වෙලාවක් ගත්තාද සහ topics කොපමණ ඉවර කළාද කියලා පෙන්වනවා.")}</div></div>`;
  },
  settings() {
    const s = D.set;
    return `<div class="v"><h1>Settings</h1>
<div class="g c"><h2>Profile</h2><div class="row">${av("big")}<div><input type="text" id="un" value="${esc(U.name)}"><br><span class="btn o up" style="margin-top:8px">${ic("cam", 16)}&nbsp;Change photo<input type="file" id="pf" accept="image/*"></span></div></div>${H("Photo එක තෝරන්න බොත්තම එබුවම ඔයාගේ phone gallery එක open වෙනවා. නම වෙනස් කරන්නත් පුළුවන්.")}</div>
<div class="g c"><h2>Look</h2><div class="row sp"><span>Light mode</span>${sw("sl", s.l)}</div><div class="row sp" style="margin:10px 0"><span>Reduce motion</span>${sw("snm", s.nm)}</div><div>${COL.map(c => `<span class="sw-c ${c == s.a ? "on" : ""}" style="background:${c}" data-c="${c}"></span>`).join("")}</div>${H("Light mode, animations අඩු කිරීම සහ ඔයාගේ කැමති පාට මෙතනින් තෝරන්න.")}</div>
<div class="g c"><h2>Alerts</h2><div class="row sp"><span>Sounds</span>${sw("ssn", s.snd)}</div><div class="row sp" style="margin:10px 0"><span>Phone notifications</span>${sw("snt", s.nt)}</div><div class="row sp"><span>Pause timer on tab switch</span>${sw("spn", s.pen)}</div>${H("Sounds සහ notifications on/off කරන්න. Tab එක මාරු කළාම timer එක නවතින්නත් පුළුවන්.")}</div>
<div class="g c"><h2>Timer</h2><div class="row">Focus <input type="range" min="10" max="90" step="5" value="${s.f}" id="sf" style="flex:1"><b id="sfv">${s.f}</b></div><div class="row">Break <input type="range" min="3" max="30" value="${s.b}" id="sb" style="flex:1"><b id="sbv">${s.b}</b></div><div class="row">Daily goal <input type="range" min="30" max="360" step="15" value="${s.goal || 120}" id="sg" style="flex:1"><b id="sgv">${s.goal || 120}</b></div>${H("Focus සහ break මිනිත්තු ගණන slider එකෙන් වෙනස් කරන්න.")}</div>
${alarmUI()}${backupCard()}
<div class="g c"><h2>Subjects</h2>${D.subs.map((x, i) => `<div class="row sp" style="margin:6px 0"><span>${esc(x.n)}</span><button class="btn o" data-a="ds${i}">${ic("trash", 16)}</button></div>`).join("")}<div class="row"><input type="text" id="ns" placeholder="New subject" style="flex:1"><button class="btn" data-a="as">+</button></div>${H("ඔයාගේ subjects add කරන්න හෝ අයින් කරන්න.")}</div>
<div class="g c row sp"><span>${esc(U.email)}</span><button class="btn r" data-a="lo">Log out</button></div></div>`;
  },
  members() {
    const dis = EDIT ? "" : "disabled";
    return `<div class="v"><h1>Control Center</h1>
<div class="g c"><div class="row sp"><div><h2>Edit mode</h2>${H("මේක on කළාම විතරයි වෙනස් කරන්න පුළුවන්.")}</div>${sw("edt", EDIT, "lq")}</div></div>
<div class="g c"><h2>Site settings</h2><p>Exam name</p><input type="text" id="xl" value="${esc(SITE.label)}" ${dis} style="width:100%"><p>Exam date & time</p>${dtSel(dis)}<p>Notice for everyone</p><input type="text" id="xn" value="${esc(SITE.notice)}" ${dis} style="width:100%"><br><br><button class="btn" data-a="ss" ${dis}>Save for everyone</button>${H("මෙතන වෙනස් කරලා Save එබුවම හැම ළමයෙකුටම Home පිටුවේ countdown එකයි notice එකයි අලුත් වෙනවා.")}</div>
${memCard()}
${tgAdmin()}${snAdmin()}${ctlStats()}${ctlTools()}${newsAdmin()}<div class="g c"><h2>Keyword library</h2><p>${SETS.length} sets in the library.</p></div></div>`;
  }
};
const TABS = [["home", "Home"], ["study", "Focus"], ["cards", "Cards"], ["learn", "Learn"], ["daily", "Daily"], ["analyze", "Stats"], ["settings", "Settings"], ["members", "Control"]];
function draw() {
  const a = $("#app");
  if (!U) { a.innerHTML = loginView(); $("[data-a=gs]").onclick = gLogin; return }
  if (tab == "members" && !isAdmin()) tab = "home";
  if (DEEP && tab == "study") { a.innerHTML = deepView(); return }
  a.innerHTML = `${bellBtn()}<nav class="g">${TABS.filter(x => x[0] != "members" || isAdmin()).map(([k, n]) => `<button data-t="${k}" class="${k == tab ? "on" : ""}">${ic(k)}<small>${n}</small></button>`).join("")}</nav><main>${V[tab]()}</main>`;
}

/* ---------- v6: Learn Lab (every tool can be removed) ---------- */
const LX = [["bl", "Blurting"], ["kl", "Keyword library"], ["mk", "Mistake notebook"], ["sp", "Smart session plan"], ["fy", "Feynman Lab"], ["pt", "Pretest Lab"], ["cb", "Calibration Lab"], ["il", "Interleave Mixer"], ["ea", "Error-type analyzer"], ["fr", "Formula recall drill"], ["ew", "Exam-week plan"]];
let LXO = 0, IL = [];
const lxOn = k => !((D.set.lh || []).includes(k) || (SITE.lxo || []).includes(k));
const lxX = k => `<button class="cf" data-a="hx_${k}" aria-label="Remove tool">${ic("trash", 14)}</button>`;
function lxMgr() {
  return `<div class="g c"><div class="row sp" data-a="lxo" style="cursor:pointer"><h2 style="margin:0">Customize Learn ${LXO ? "▾" : "▸"}</h2><small>${LX.filter(x => lxOn(x[0])).length}/${LX.length} on</small></div>${LXO ? LX.map(([k, n]) => `<div class="row sp" style="margin:8px 0"><span>${n}${(SITE.lxo || []).includes(k) ? " <small>(off by admin)</small>" : ""}</span>${sw("lh_" + k, !(D.set.lh || []).includes(k))}</div>`).join("") : ""}${H("Learn පිටුවේ තියෙන ඕනෑම tool එකක් මෙතනින් on/off කරන්න. ඔයාට අවශ්‍ය නැති ඒවා off කළාම පිටුවෙන් අයින් වෙනවා, ඕන වුණාම ආයෙත් on කරන්න පුළුවන්. (අලුත් tools වල 🗑 එබුවත් අයින් වෙනවා.)")}</div>`;
}
function fyCard() {
  const L = D.fy = D.fy || [];
  return `<div class="g c"><div class="row sp"><h2 style="margin:0">🧒 Feynman Lab</h2>${lxX("fy")}</div><p>Richard Feynman: simple වචනවලින් කියන්න බැරි නම්, තාම තේරිලා නෑ.</p><input type="text" id="fyt" placeholder="Topic (e.g. Integration by parts)" style="width:100%;margin:8px 0"><textarea id="fyx" rows="4" placeholder="Explain it to a 10-year-old..."></textarea><button class="btn" data-a="fyc" style="margin-top:8px">Check my explanation</button>${L.slice(0, 3).map(e => `<div class="it"><div class="row sp"><b>${esc(e.t)} • ${e.sc}/100</b><button class="cf" data-a="fyd${e.id}">${ic("trash", 14)}</button></div>${e.jg.length ? `<small>Too technical: ${e.jg.map(esc).join(", ")}</small><br>` : ""}${e.ex ? "" : "<small>Add a real example.</small>"}</div>`).join("")}${H("පාඩමක් නමයි, ඒක පොඩි ළමයෙකුට කියනවා වගේ ලියන්න. Check එබුවම අමාරු වචන සහ උදාහරණයක් නැති වුණොත් පෙන්නලා ලකුණු දෙනවා. අමාරු වචන ලෙහෙසි කරලා ආයෙත් ලියන්න.")}</div>`;
}
function ptCard() {
  const L = D.pt = D.pt || [], dn = L.filter(x => x.ok != null), h = dn.filter(x => x.ok).length;
  return `<div class="g c"><div class="row sp"><h2 style="margin:0">🎯 Pretest Lab</h2>${lxX("pt")}</div><p>Kornell: ඉගෙනගන්න කලින් අනුමාන කරනවා නම් පස්සේ උත්තරය හොඳට මතක හිටිනවා.</p><input type="text" id="ptt" placeholder="New topic / question" style="width:100%;margin:8px 0"><input type="text" id="ptg" placeholder="Your guess before studying" style="width:100%;margin-bottom:8px"><button class="btn" data-a="pta">Save guess</button>${dn.length ? `<p>Guess accuracy ${Math.round(h / dn.length * 100)}% (${dn.length})</p>` : ""}${L.slice(0, 4).map(e => `<div class="it"><b>${esc(e.t)}</b><br><small>${esc(e.g)}</small><div class="row" style="margin-top:6px">${e.ok == null ? `<button class="cf" data-a="pk${e.id}_1">Was right</button><button class="cf" data-a="pk${e.id}_0">Was wrong</button>` : `<small>${e.ok ? "✓ right" : "✗ wrong (wrong guesses stick best)"}</small>`}<button class="cf" data-a="ptd${e.id}">${ic("trash", 14)}</button></div></div>`).join("")}${H("අලුත් පාඩමකට කලින් උත්තරය අනුමාන කරලා ලියන්න. ඉගෙනගත්තට පස්සේ 'Was right/wrong' එබුවම ඔයාගේ අනුමාන නිවැරදි ප්‍රතිශතය පෙනෙනවා.")}</div>`;
}
function cbCard() {
  const L = D.cb = D.cb || [], r = L.slice(0, 10), g = r.length ? r.reduce((a, x) => a + x.p - x.a, 0) / r.length : 0;
  return `<div class="g c"><div class="row sp"><h2 style="margin:0">⚖️ Calibration Lab</h2>${lxX("cb")}</div><p>"මට පුළුවන්" කියන හැඟීම ඇත්තද කියලා මැනලා බලන්න (metacognition).</p><div class="row" style="margin:8px 0"><input type="number" id="cbp" min="0" max="100" placeholder="Predicted %" style="width:46%"><input type="number" id="cba" min="0" max="100" placeholder="Actual %" style="width:46%"></div><button class="btn" data-a="cbl">Log</button>${r.length ? `<p style="margin-top:8px">Average gap ${g > 0 ? "+" : ""}${g.toFixed(0)}% — ${g > 10 ? "overconfident: quiz yourself before saying 'I know it'" : g < -10 ? "underconfident: you know more than you think" : "well calibrated"}</p><button class="cf" data-a="cbx">Clear history</button>` : ""}${H("Quiz/past paper එකකට කලින් ලකුණු කීයක් ගන්නවා කියලා හිතන්න (Predicted). ඉවර වුණාම ඇත්ත ලකුණු (Actual) දාලා Log කරන්න. ඔයා වැඩියෙන් ආත්ම විශ්වාසයෙන්ද, අඩුවෙන්ද කියලා පෙන්නනවා.")}</div>`;
}
function ilCard() {
  return `<div class="g c"><div class="row sp"><h2 style="margin:0">🔀 Interleave Mixer</h2>${lxX("il")}</div><p>එක subject එක පැය ගණන් නොකර, මිශ්‍ර කරලා කරන එක ඉගෙනීමට හොඳයි (Rohrer).</p><button class="btn" data-a="ilm" style="margin:8px 0">Mix a session</button>${IL.map(x => `<div class="row sp" style="margin:6px 0"><span><b>${esc(x.n)}</b><br><small>${esc(x.s)} • 8 min</small></span><button class="cf" data-a="tf${x.i}_${x.j}">${ic("study", 14)}</button></div>`).join("")}${H("Mix එබුවම ඔයාගේ ඉවර නොකළ topics වලින් වෙනස් subjects 4ක් තෝරනවා. එක topic එකකට විනාඩි 8 බැගින්; ▶ එබුවම focus timer එකට යනවා.")}</div>`;
}
/* ---------- v8: Learn tools part 2 (error analyzer, formula drill, exam-week plan) ---------- */
const ET = [["cn", "Concept"], ["cl", "Calculation"], ["fm", "Formula"], ["rd", "Misread"], ["tm", "Time"]];
const ETA = { cn: "Re-learn the idea, then redo 2 similar questions.", cl: "Write every step and re-check signs before moving on.", fm: "Use the Formula drill daily until formulas come without looking.", rd: "Underline what is asked and the given data before you start.", tm: "Practise with a timer; skip slow questions and come back." };
const etn = k => (ET.find(e => e[0] == k) || [0, ""])[1];
const FRI = [0, 1, 3, 7, 14];
let FR = { id: 0, show: 0, tp: "" };
function eaCard() {
  const mk = D.mk || [], tg = mk.filter(x => x.et), un = mk.filter(x => !x.et);
  const rows = ET.map(([k, n]) => ({ k, n, c: tg.filter(x => x.et == k).length, o: tg.filter(x => x.et == k && !x.ok).length })).sort((a, b) => b.c - a.c), mx = Math.max(1, rows[0].c);
  return `<div class="g c"><div class="row sp"><h2 style="margin:0">🔍 Error-type analyzer</h2>${lxX("ea")}</div><p>${mk.length ? `${tg.length}/${mk.length} mistakes tagged` : "Add mistakes in the Mistake notebook first."}</p>${tg.length ? rows.map(r => `<div style="margin:8px 0"><div class="row sp"><span>${r.n}</span><small>${r.c} • ${r.o} open</small></div><div class="bar"><b style="width:${r.c / mx * 100}%"></b></div></div>`).join("") + `<p><b>Biggest pattern: ${rows[0].n}.</b> ${ETA[rows[0].k]}</p>` : ""}${un.slice(0, 3).map(x => `<div class="it"><b>${esc(x.q)}</b><div>${ET.map(([k, n]) => `<span class="chip" data-a="ea_${x.id}_${k}">${n}</span>`).join("")}</div></div>`).join("")}${H("Mistake notebook එකේ වැරදි වර්ග කරලා (Concept / Calculation / Formula / Misread / Time) පෙන්නනවා. වැඩියෙන්ම වැරදෙන වර්ගය සහ ඒක හදාගන්න උපදෙසක් පෙනෙනවා. වර්ගය නැති වැරදි එකක් යටින් chip එකක් එබුවම tag වෙනවා.")}</div>`;
}
function frNext() { const n = Date.now(), L = (D.fr || []).filter(x => (x.due || 0) <= n).sort((a, b) => (a.b || 0) - (b.b || 0) || (a.due || 0) - (b.due || 0)); return L.find(x => x.id == FR.id) || L[0] || null }
function frCard() {
  const L = D.fr = D.fr || [], c = frNext(), n = Date.now(), due = L.filter(x => (x.due || 0) <= n).length, nz = s => String(s).toLowerCase().replace(/\s+/g, "");
  return `<div class="g c"><div class="row sp"><h2 style="margin:0">📐 Formula recall drill</h2>${lxX("fr")}</div><p>${L.length} formulas • ${due} due • ${L.filter(x => (x.b || 0) >= 3).length} well known</p>${c ? `<div class="it"><h2>${esc(c.n)}</h2>${FR.show ? `${FR.tp ? `<small>${nz(FR.tp) == nz(c.f) ? "✓ Your answer matches" : "Yours: " + esc(FR.tp)}</small>` : ""}<p style="font-size:18px"><b>${esc(c.f)}</b></p><div class="row"><button class="btn" data-a="fry">Got it</button><button class="btn o" data-a="frn">Missed</button></div>` : `<input type="text" id="frt" placeholder="Type it from memory (optional)" style="width:100%;margin:8px 0"><button class="btn" data-a="frs">Reveal</button>`}</div>` : L.length ? "<p>All caught up ✓ Come back later.</p>" : ""}<input type="text" id="frnm" placeholder="Formula name (e.g. Quadratic roots)" style="width:100%;margin:8px 0"><input type="text" id="frfm" placeholder="Formula (e.g. x = (-b ± √(b²-4ac)) / 2a)" style="width:100%;margin-bottom:8px"><button class="btn" data-a="fra">Add formula</button>${L.slice(0, 6).map(x => `<div class="row sp" style="margin:6px 0"><span>${esc(x.n)} <small>${"●".repeat(x.b || 0)}${"○".repeat(4 - (x.b || 0))}</small></span><button class="cf" data-a="frd${x.id}">${ic("trash", 14)}</button></div>`).join("")}${H("සූත්‍රයක නමයි සූත්‍රයයි ඇතුල් කරන්න. Drill එකේදී නම විතරක් පෙනෙනවා; මතකයෙන් ලියලා (නැත්නම් හිතලා) Reveal එබුවම උත්තරේ පෙනෙනවා. Got it එබුවොත් ඊළඟ වතාව දවස් 1, 3, 7, 14 විදිහට පස්සට යනවා; Missed නම් ඉක්මනින්ම ආයෙත් එනවා.")}</div>`;
}
function ewCard() {
  const t = SITE.exam ? new Date(SITE.exam) : null, n = new Date(), hd = `<div class="row sp"><h2 style="margin:0">🗓 Exam-week plan</h2>${lxX("ew")}</div>`, hint = H("විභාගයට කලින් අවසාන දවස් 7 (දවස් 7කට වඩා අඩු නම් අද සිට) සඳහා ඉගෙනීම් plan එකක්. දුර්වල topics මුලින්, subjects මාරු මාරුවට; අන්තිම දවස සැහැල්ලු revision. Plan එක ඔයාගේ topics, mistakes, formulas අනුව ඉබේම හැදෙනවා.");
  if (!t || isNaN(t)) return `<div class="g c">${hd}<p>Exam date not set yet.</p>${hint}</div>`;
  const t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()), x0 = new Date(t.getFullYear(), t.getMonth(), t.getDate()), gap = Math.round((x0 - t0) / DAY);
  if (gap <= 0) return `<div class="g c">${hd}<p>${t > n ? "Exam is today. Stay calm, you've got this!" : "Exam time has passed."}</p>${hint}</div>`;
  const len = Math.min(7, gap), st = new Date(x0); st.setDate(st.getDate() - len);
  const q = D.subs.map(s => s.t.filter(x => !x.d).map(x => ({ s: s.n, n: x.n, r: RK.indexOf(x.c || 0) })).sort((a, b) => a.r - b.r)), Q = [];
  for (let r = 0; r < 50; r++) q.forEach(l => { if (l[r]) Q.push(l[r]) });
  if (!Q.length) D.subs.forEach(s => Q.push({ s: s.n, n: "Past paper" }));
  const ns = Math.min(5, Math.max(2, Math.round((D.set.goal || 120) / (D.set.f || 25)))), op = (D.mk || []).filter(x => !x.ok).length, fd = (D.fr || []).length;
  let k = 0;
  const days = [...Array(len)].map((_, i) => {
    const d = new Date(st), last = i == len - 1, it = []; d.setDate(d.getDate() + i);
    if (last) it.push("Light review of weak topics (30 min)", "Skim formulas and fixed mistakes", "Sleep early");
    else { if (fd) it.push("Formula drill (10 min)"); for (let j = 0; j < ns; j++) { const x = Q[k++ % Q.length]; it.push(`${esc(x.s)}: ${esc(x.n)} (${D.set.f} min)`) } if (op && i % 2) it.push(`Fix open mistakes (${op})`) }
    return `<div class="it" style="${i == 0 && gap <= 7 ? "border-left:3px solid var(--a);padding-left:8px" : ""}"><b>${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}${last ? " • light day" : ""}</b><br><small>${it.join("<br>")}</small></div>`;
  });
  return `<div class="g c">${hd}<p>${gap} day${gap > 1 ? "s" : ""} to ${esc(SITE.label || "exam")}${gap > 7 ? ` • plan starts in ${gap - 7} days` : ""}</p>${days.join("")}${hint}</div>`;
}
const newTools = () => `${lxOn("fy") ? fyCard() : ""}${lxOn("pt") ? ptCard() : ""}${lxOn("cb") ? cbCard() : ""}${lxOn("il") ? ilCard() : ""}${lxOn("ea") ? eaCard() : ""}${lxOn("fr") ? frCard() : ""}${lxOn("ew") ? ewCard() : ""}`;
/* ---------- v7: Telegram channels + admin username on Home ---------- */
const tgNorm = x => { x = (x || "").trim().replace(/^@/, ""); if (/^[A-Za-z0-9_]{4,}$/.test(x)) return "https://t.me/" + x; const m = x.match(/^(?:https?:\/\/)?(?:www\.)?(?:t|telegram)\.me\/([^\s?#]+)/i); return m ? "https://t.me/" + m[1].replace(/\/+$/, "") : "" };
const tgUser = l => { const m = (l || "").match(/t\.me\/(?:s\/)?([A-Za-z0-9_]{4,})\/?$/); return m && !/^(joinchat|addlist)$/i.test(m[1]) ? m[1] : "" };
const tgAv = (l, n) => { const u = tgUser(l); return `<div class="av tg">${esc((n || "?").trim().charAt(0).toUpperCase())}${u ? `<img src="https://t.me/i/userpic/320/${u}.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}</div>` };
function commCard() {
  const tg = SITE.tg || [], ad = SITE.adm;
  if (!tg.length && !(ad && ad.u)) return "";
  const adm = ad && ad.u ? `<a class="tgr adm" href="https://t.me/${esc(ad.u)}" target="_blank" rel="noopener">${tgAv("https://t.me/" + ad.u, ad.u)}<div class="tgb"><b>@${esc(ad.u)}</b>${ad.x ? `<span>${esc(ad.x)}</span>` : ""}<small class="lk">t.me/${esc(ad.u)}</small></div><i class="go">Message</i></a>` : "";
  const rows = tg.map(c => `<a class="tgr" href="${esc(c.l)}" target="_blank" rel="noopener">${tgAv(c.l, c.n)}<div class="tgb"><b>${esc(c.n)}</b>${c.x ? `<span>${esc(c.x)}</span>` : ""}<small class="lk">${esc(c.l.replace("https://", ""))}</small></div><i class="go">Join</i></a>`).join("");
  return `<div class="g c comm"><h2>${ic("bell", 20)} Community</h2>${adm}${rows}</div>`;
}
function tgAdmin() {
  const d = EDIT ? "" : "disabled", tg = SITE.tg || [], ad = SITE.adm || {};
  return `<div class="g c"><h2>Telegram on Home</h2><p>Channels everyone sees on Home. Photo is taken from the channel automatically.</p>
<input type="text" id="tgn" placeholder="Channel name" ${d} style="width:100%;margin:4px 0"><input type="text" id="tgl" placeholder="Link (t.me/yourchannel)" ${d} style="width:100%;margin:4px 0"><input type="text" id="tgx" placeholder="Short notice (optional)" ${d} style="width:100%;margin:4px 0"><button class="btn" data-a="tga" ${d}>Add channel</button>
${tg.map(c => `<div class="row sp" style="margin:8px 0"><div class="row" style="min-width:0">${tgAv(c.l, c.n)}<span style="min-width:0;overflow:hidden;text-overflow:ellipsis"><b>${esc(c.n)}</b><br><small>${esc(c.l.replace("https://", ""))}</small></span></div><button class="btn o" data-a="tgd${c.id}" ${d}>${ic("trash", 16)}</button></div>`).join("")}
<h2 style="margin-top:16px">My username</h2><input type="text" id="amu" value="${esc(ad.u || "")}" placeholder="@username" ${d} style="width:100%;margin:4px 0"><input type="text" id="amx" value="${esc(ad.x || "")}" placeholder="Small notice (e.g. Message me for help)" ${d} style="width:100%;margin:4px 0"><button class="btn" data-a="amv" ${d}>Save username</button>
${H("Channel එකක නම, link එක, පොඩි notice එකක් දාලා Add කරන්න. Home එකේ හැමෝටම link එකත් එක්ක පෙනෙනවා. Channel එකේ profile photo එක ඉබේම එනවා (public channel නම්). ඔයාගේ username එක Save කළාම Home එකේ Message button එකක් එක්ක පෙනෙනවා. Edit mode on කරලා විතරයි වෙනස් කරන්න පුළුවන්.")}</div>`;
}
/* ---------- v7: member search/filter, scheduled notices ---------- */
const MQ = { q: "", f: "all" };
const idle = u => (u.seen || 0) < Date.now() - 7 * DAY;
const seenTxt = u => { if (!u.seen) return "Never opened"; const d = Math.floor((Date.now() - u.seen) / DAY); return d < 1 ? "Active today" : d + "d ago" };
function memList() {
  const n = Date.now(), q = MQ.q.toLowerCase(), F = { new: u => n - (u.joined || 0) < 7 * DAY, today: u => (u.seen || 0) > n - DAY, idle };
  let a = USERS.filter(u => !q || ((u.name || "") + " " + (u.email || "")).toLowerCase().includes(q)); if (F[MQ.f]) a = a.filter(F[MQ.f]);
  a.sort((x, y) => MQ.f == "idle" ? (x.seen || 0) - (y.seen || 0) : (y.seen || 0) - (x.seen || 0));
  return `<small>${a.length} shown</small>` + (a.length ? a.map(u => `<div class="row sp" style="margin:8px 0"><div class="row" style="min-width:0"><div class="av" style="width:38px;height:38px;${u.photo ? `background-image:url(${esc(u.photo)})` : ""}">${u.photo ? "" : esc((u.name || "?")[0])}</div><div style="min-width:0"><b>${esc(u.name)}</b> ${idle(u) ? '<span class="bd2">Inactive</span>' : ""}<br><small>${esc(u.email)}</small><br><small>${seenTxt(u)} • joined ${u.joined ? new Date(u.joined).toLocaleDateString() : "?"}</small></div></div>${EDIT && u.email !== U.email ? `<button class="btn o" data-a="rm" data-id="${esc(u.id || u.email)}">${ic("trash", 16)}</button>` : ""}</div>`).join("") : "<p>No members found</p>");
}
function memCard() {
  return `<div class="g c"><h2>Members (${USERS.length})</h2><input type="text" id="mq" value="${esc(MQ.q)}" placeholder="Search name or email" style="width:100%;margin:6px 0"><div>${[["all", "All"], ["new", "New 7d"], ["today", "Active today"], ["idle", "Inactive 7d+"]].map(([k, n]) => `<span class="chip ${MQ.f == k ? "on" : ""}" data-a="mf_${k}">${n}</span>`).join("")}</div><div id="ml">${memList()}</div>${H("නමින් හෝ email එකෙන් search කරන්න. Inactive 7d+ එබුවම දවස් 7කට වඩා site එකට නාවපු ළමයි පෙනෙනවා (වැඩියෙන්ම නාවපු එක උඩින්). Edit mode on කළාම 🗑 එබුවම අයින් කරන්න පුළුවන්.")}</div>`;
}
const snState = s => { const n = Date.now(); return n < s.at ? "wait" : (s.until && n >= s.until ? "end" : "live") };
const snLive = () => (SITE.sn || []).filter(s => snState(s) == "live");
function noticeCards() { return [SITE.notice].filter(Boolean).concat(snLive().map(s => s.x)).map(x => `<div class="g c notice"><div class="row">${ic("bell", 18)} <span>${esc(x)}</span></div></div>`).join("") }
function snAdmin() {
  const d = EDIT ? "" : "disabled", L = { wait: "Scheduled", live: "Live now", end: "Ended" };
  return `<div class="g c"><h2>Schedule a notice</h2><input type="text" id="sct" placeholder="Notice text" ${d} style="width:100%;margin:4px 0"><p>Show from</p><input type="datetime-local" id="scs" ${d} style="width:100%;margin:4px 0"><p>Show for</p><select id="sch" ${d} style="width:100%;margin:4px 0"><option value="6">6 hours</option><option value="24" selected>1 day</option><option value="72">3 days</option><option value="168">7 days</option><option value="0">Until I delete it</option></select><br><br><button class="btn" data-a="sna" ${d}>Schedule</button>
${(SITE.sn || []).slice().sort((a, b) => a.at - b.at).map(s => `<div class="row sp" style="margin:8px 0"><span style="min-width:0"><b>${esc(s.x)}</b><br><small>${L[snState(s)]} • ${new Date(s.at).toLocaleString()}</small></span><button class="btn o" data-a="snd${s.id}" ${d}>${ic("trash", 16)}</button></div>`).join("")}
${H("Notice එකක් අනාගතයේ කවදා පෙන්නන්නද කියලා තෝරන්න. ඒ වෙලාව ආපු ගමන් හැම ළමයෙකුටම Home එකේ පෙනෙනවා, කාලය ඉවර වුණාම ඉබේම නැති වෙනවා.")}</div>`;
}
function ctlStats() {
  const n = Date.now(), c = f => USERS.filter(f).length;
  return `<div class="g c"><h2>Overview</h2><div class="grid" style="gap:8px"><div><p>Members</p><h1>${USERS.length}</h1></div><div><p>New (7d)</p><h1>${c(u => n - (u.joined || 0) < 7 * DAY)}</h1></div><div><p>Active today</p><h1>${c(u => (u.seen || 0) > n - DAY)}</h1></div><div><p>Active (7d)</p><h1>${c(u => (u.seen || 0) > n - 7 * DAY)}</h1></div></div>${H("Site එකේ ළමයි කී දෙනාද, මේ සතියේ අලුතින් ආපු ගණන, අද සහ සතියේ site එකට ආපු ගණන. (ළමයා ආයෙත් site එකට ආවම දත්ත අලුත් වෙනවා.)")}</div>`;
}
function ctlTools() {
  const d = EDIT ? "" : "disabled";
  return `<div class="g c"><h2>Learn tools for everyone</h2>${LX.map(([k, nm]) => `<div class="row sp" style="margin:8px 0"><span>${nm}</span><label class="sw"><input type="checkbox" data-a="lg_${k}" ${(SITE.lxo || []).includes(k) ? "" : "checked"} ${d}><i></i></label></div>`).join("")}${H("Edit mode on කරලා tool එකක් off කළාම හැම ළමයෙකුටම Learn පිටුවෙන් ඒක අයින් වෙනවා.")}</div>`;
}
document.addEventListener("click", e => {
  if (!U || !D) return; const t = e.target.closest("[data-a]"); if (!t) return; const a = t.dataset.a, v = id => $("#" + id) ? $("#" + id).value.trim() : "", m = a.match(/^pk(\d+)_([01])$/);
  if (a == "lxo") { LXO = !LXO; draw() }
  else if (a.startsWith("hx_")) { D.set.lh = (D.set.lh || []).concat(a.slice(3)); save(); draw(); toast("Removed. Bring it back from Customize Learn") }
  else if (a == "fyc") {
    const tp = v("fyt"), x = v("fyx"), w = x.split(/\s+/).filter(Boolean); if (!tp || w.length < 8) return toast("Add a topic and a longer explanation");
    const jg = [...new Set(w.map(k => k.replace(/[^A-Za-z]/g, "")).filter(k => k.length >= 10))].slice(0, 6), ex = /example|for instance|e\.g|like |උදාහරණ/i.test(x), sc = Math.max(0, 100 - jg.length * 12 - (ex ? 0 : 20) - (w.length > 120 ? 15 : 0));
    D.fy.unshift({ id: Date.now(), t: tp.slice(0, 60), sc, jg, ex }); D.fy = D.fy.slice(0, 20); save(); draw();
  }
  else if (/^fyd\d+$/.test(a)) { D.fy = D.fy.filter(x => x.id != a.slice(3)); save(); draw() }
  else if (a == "pta") { const tp = v("ptt"), g = v("ptg"); if (!tp || !g) return toast("Write the topic and your guess"); D.pt.unshift({ id: Date.now(), t: tp.slice(0, 60), g: g.slice(0, 120), ok: null }); D.pt = D.pt.slice(0, 30); save(); draw() }
  else if (m) { const x = D.pt.find(k => k.id == m[1]); if (x) { x.ok = +m[2]; save(); draw() } }
  else if (/^ptd\d+$/.test(a)) { D.pt = D.pt.filter(x => x.id != a.slice(3)); save(); draw() }
  else if (a == "cbl") { const p = +v("cbp"), r = +v("cba"); if (v("cbp") === "" || v("cba") === "" || p < 0 || p > 100 || r < 0 || r > 100) return toast("Enter both values (0-100)"); D.cb.unshift({ id: Date.now(), d: Date.now(), p, a: r }); D.cb = D.cb.slice(0, 30); save(); draw() }
  else if (a == "cbx") { D.cb = []; save(); draw() }
  else if (a == "ilm") {
    const q = D.subs.map((s, i) => s.t.map((x, j) => ({ i, j, s: s.n, n: x.n, d: x.d })).filter(x => !x.d).sort(() => Math.random() - .5)); IL = [];
    for (let r = 0; IL.length < 4 && r < 20; r++) q.forEach(l => { if (l[r] && IL.length < 4) IL.push(l[r]) });
    if (!IL.length) toast("Add topics in Subject Studio first"); draw();
  }
  else if (a.startsWith("ea_")) { const [, id, k] = a.split("_"), x = (D.mk || []).find(y => y.id == id); if (x) { x.et = k; save(); draw() } }
  else if (a == "fra") { const n = v("frnm"), f = v("frfm"); if (!n || !f) return toast("Write the formula name and the formula"); D.fr.unshift({ id: Date.now(), n: n.slice(0, 60), f: f.slice(0, 160), b: 0, due: 0 }); D.fr = D.fr.slice(0, 60); save(); draw() }
  else if (a == "frs") { const c = frNext(); if (c) { FR = { id: c.id, show: 1, tp: v("frt") }; draw() } }
  else if (a == "fry" || a == "frn") { const c = frNext(); if (c) { c.b = a == "fry" ? Math.min(4, (c.b || 0) + 1) : 0; c.due = a == "fry" ? Date.now() + FRI[c.b] * DAY : Date.now() + 5 * 6e4; FR = { id: 0, show: 0, tp: "" }; save(); draw() } }
  else if (/^frd\d+$/.test(a)) { D.fr = D.fr.filter(x => x.id != a.slice(3)); FR = { id: 0, show: 0, tp: "" }; save(); draw() }
});
document.addEventListener("change", async e => {
  if (!U || !D) return; const t = e.target, a = t.dataset.a || "";
  if (a.startsWith("lh_")) { const k = a.slice(3), h = (D.set.lh || []).filter(x => x != k); D.set.lh = t.checked ? h : h.concat(k); save(); draw() }
  else if (a.startsWith("lg_")) {
    if (!isAdmin() || !EDIT) { t.checked = !t.checked; return }
    const k = a.slice(3), h = (SITE.lxo || []).filter(x => x != k); SITE.lxo = t.checked ? h : h.concat(k); await saveSite(); draw();
  }
});

/* ---------- events ---------- */
document.addEventListener("click", async e => {
  if (!U) return;
  if (e.target.classList && e.target.classList.contains("nw")) { e.target.remove(); return }
  const t = e.target.closest("[data-t],[data-a],[data-o],[data-c],[data-sg]"); if (!t) return;
  if (t.dataset.t) { tab = t.dataset.t; draw(); return }
  if (t.dataset.o) { const i = +t.dataset.o; openSub = openSub == i ? -1 : i; draw(); return }
  if (t.dataset.c) { D.set.a = t.dataset.c; save(); theme(); draw(); return }
  if (t.dataset.sg) { const [x, l] = t.dataset.sg.split("|"); D.alarms.push({ id: Date.now(), t: x, l, on: 1 }); save(); draw(); toast("Alarm added"); return }
  const a = t.dataset.a, n = parseInt(a.replace(/\D/g, "")) || 0, id = t.dataset.id, v = k => $("#" + k) ? $("#" + k).value.trim() : "";
  if (a == "tg") { if (T.on) { T.on = 0; clearInterval(T.iv); T.left = Math.round((T.end - Date.now()) / 1e3) } else { T.on = 1; T.end = Date.now() + T.left * 1e3; clearInterval(T.iv); T.iv = setInterval(tick, 500); ac() } draw() }
  else if (a == "tr") { T.on = 0; clearInterval(T.iv); T.left = tot(); draw() }
  else if (a == "tk") { T.on = 0; clearInterval(T.iv); T.mode = T.mode == "f" ? "b" : "f"; T.left = tot(); draw() }
  else if (a == "rv") { R.show = 1; draw() }
  else if (/^r\d$/.test(a)) { const c = D.cards.filter(c => c.due <= Date.now())[0], iv = [0, 1, 3, 7, 16, 35]; if (!c) return; c.b = n == 0 ? 0 : Math.min(5, c.b + (n == 2 ? 2 : 1)); c.due = n == 0 ? Date.now() + 6e5 : Date.now() + iv[c.b] * DAY; D.rev = (D.rev || 0) + 1; D.rd = D.rd || {}; D.rd[dayk(Date.now())] = (D.rd[dayk(Date.now())] || 0) + 1; R.show = 0; save(); draw() }
  else if (a == "ac") { const q = $("#cq").value.trim(), an = $("#ca").value.trim(); if (!q || !an) return toast("Enter question and answer"); D.cards.push({ q, a: an, s: $("#cs").value, b: 0, due: Date.now() }); save(); draw(); toast("Card added") }
  else if (a == "aa") { D.alarms.push({ id: Date.now(), t: $("#at").value, l: $("#al").value || "Alarm", on: 1 }); save(); draw() }
  else if (a == "tt") { D.set.tone = $("#tn").value; save(); alarmSound() }
  else if (/^ad\d/.test(a)) { D.alarms = D.alarms.filter(x => x.id != +a.slice(2)); save(); draw() }
  else if (/^at\d/.test(a)) { const vs = $("#nt" + n).value.split(",").map(x => x.trim().slice(0, 60)).filter(Boolean); if (vs.length) { vs.forEach(v => D.subs[n].t.push({ n: v, d: 0, c: 0 })); save(); draw(); toast(vs.length + " topic(s) added") } }
  else if (/^ds\d/.test(a)) { D.subs.splice(n, 1); save(); draw() }
  else if (a == "as") { const v = $("#ns").value.trim(); if (v) { D.subs.push({ n: v, t: [] }); save(); draw() } }
  else if (/^en\d$/.test(a)) { D.en = D.en || []; D.en.push({ d: Date.now(), v: n, f: EF.slice() }); EF = []; save(); draw(); toast("Energy logged: " + EL[n - 1][1]) }
  else if (a.startsWith("fx_")) { const k = a.slice(3); EF = EF.includes(k) ? EF.filter(x => x != k) : EF.concat(k); draw() }
  else if (a == "enu") { if (D.en && D.en.length) { D.en.pop(); save(); draw(); toast("Last check-in removed") } }
  else if (/^ef-?\d+_-?\d+_\d+$/.test(a)) { const [i, , m] = a.slice(2).split("_").map(Number); if (!T.on) { D.set.f = m; T.mode = "f"; T.left = tot(); save() } if (i >= 0 && i < D.subs.length) T.sub = i; tab = "study"; draw(); toast(T.on ? "Timer already running" : "Focus set to " + m + " min") }
  else if (a == "bc") {
    B.k = $("#bk").value; B.t = $("#bt").value;
    const ks = B.k.split(",").map(x => x.trim()).filter(Boolean), tx = B.t.toLowerCase(); if (!ks.length) return toast("Enter keywords");
    const h = ks.filter(k => tx.includes(k.toLowerCase())), m = ks.filter(k => !h.includes(k));
    B.r = { h, m, p: Math.round(h.length / ks.length * 100) }; D.bl = (D.bl || 0) + 1; save(); draw();
  }
  else if (a == "pick") { const s = SETS.find(x => x.id == id); if (s) { B.k = s.k; B.t = ""; B.r = null; draw(); toast("Loaded: " + s.t) } }
  else if (a == "sa") {
    const tt = $("#stt").value.trim(), kk = $("#stk").value.trim(); if (!tt || !kk) return toast("Enter title and keywords");
    const row = { t: tt.slice(0, 70), k: kk.slice(0, 500), by: U.name, at: Date.now() };
    if (FB) { try { await db.collection("sets").add(row) } catch (er) { return toast("Could not add set") } }
    else { SETS.unshift(Object.assign({ id: "" + Date.now() }, row)); ls.set("sg_sets", SETS); draw() }
    toast("Added to library");
  }
  else if (a == "sd") {
    if (!isAdmin()) return;
    if (FB) { try { await db.doc("sets/" + id).delete() } catch (er) { toast("Delete failed") } }
    else { SETS = SETS.filter(x => x.id != id); ls.set("sg_sets", SETS); draw() }
  }
  else if (a.startsWith("mf_")) { MQ.f = a.slice(3); draw() }
  else if (a == "sna") {
    if (!isAdmin() || !EDIT) return;
    const tx = v("sct"), at = new Date(v("scs")).getTime(), hr = +v("sch"); if (!tx || isNaN(at)) return toast("Add the text and a start time");
    SITE.sn = (SITE.sn || []).concat({ id: Date.now(), x: tx.slice(0, 200), at, until: hr ? at + hr * 36e5 : 0 }); await saveSite(); toast("Notice scheduled"); draw();
  }
  else if (/^snd\d+$/.test(a)) {
    if (!isAdmin() || !EDIT) return;
    SITE.sn = (SITE.sn || []).filter(x => x.id != a.slice(3)); await saveSite(); draw();
  }
  else if (a == "tga") {
    if (!isAdmin() || !EDIT) return;
    const nm = v("tgn"), ln = tgNorm(v("tgl")); if (!nm || !ln) return toast("Add a name and a valid t.me link");
    SITE.tg = (SITE.tg || []).concat({ id: Date.now(), n: nm.slice(0, 40), l: ln, x: v("tgx").slice(0, 140) }); await saveSite(); toast("Channel added for everyone"); draw();
  }
  else if (/^tgd\d+$/.test(a)) {
    if (!isAdmin() || !EDIT) return;
    SITE.tg = (SITE.tg || []).filter(c => c.id != a.slice(3)); await saveSite(); draw();
  }
  else if (a == "amv") {
    if (!isAdmin() || !EDIT) return;
    const u = tgUser(tgNorm(v("amu"))); SITE.adm = u ? { u, x: v("amx").slice(0, 140) } : null; await saveSite(); toast(u ? "Username saved" : "Username removed"); draw();
  }
  else if (a == "ss") {
    if (!isAdmin() || !EDIT) return;
    const ex = dtVal(); if (ex === null) return toast("That date does not exist"); SITE = Object.assign({}, SITE, { exam: ex, label: $("#xl").value.trim() || "Exam", notice: $("#xn").value.trim() });
    if (FB) { try { await db.doc("site/config").set(SITE, { merge: true }); toast("Saved for everyone") } catch (er) { toast("Save failed: check rules/admin email") } }
    else { ls.set("sg_site", SITE); toast("Saved") }
    draw();
  }
  else if (a == "rm") {
    if (!isAdmin() || !EDIT) return;
    if (FB) { try { await db.doc("users/" + id).delete() } catch (er) { toast("Remove failed") } }
    else { USERS = USERS.filter(x => x.email != id); ls.set("sg_users", USERS); draw() }
  }
  else if (a == "dp") { DEEP = true; wake(true); draw() }
  else if (a == "dx") { DEEP = false; wake(false); draw() }
  else if (a == "pa") { const nm = $("#ppn").value.trim(), mv = $("#ppm").value, m = +mv; if (!nm || mv === "" || m < 0 || m > 100) return toast("Enter paper name and marks (0-100)"); D.pp.push({ d: Date.now(), s: $("#pps").value, n: nm.slice(0, 40), m }); save(); draw() }
  else if (/^pd\d/.test(a)) { D.pp.splice(n, 1); save(); draw() }
  else if (a == "ma") { const q = $("#mq").value.trim(), w = $("#mw").value.trim(); if (!q) return toast("Write the question or topic"); D.mk.push({ id: Date.now(), q: q.slice(0, 120), w: w.slice(0, 200), ok: 0, et: ($("#met") || {}).value || "" }); save(); draw() }
  else if (/^mx\d/.test(a)) { D.mk = D.mk.filter(x => x.id != n); save(); draw() }
  else if (a == "ib") {
    const ls2 = $("#bu").value.split("\n").map(l => l.split("|")).filter(p => p.length >= 2 && p[0].trim() && p[1].trim()); if (!ls2.length) return toast("Use the format: Question | Answer");
    ls2.forEach(p => D.cards.push({ q: p[0].trim(), a: p.slice(1).join("|").trim(), s: $("#cs").value, b: 0, due: Date.now() })); save(); draw(); toast(ls2.length + " cards added");
  }
  else if (a == "bx") { const b = new Blob([JSON.stringify(D)], { type: "application/json" }), u = URL.createObjectURL(b), l = document.createElement("a"); l.href = u; l.download = "studyglass-backup.json"; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); toast("Backup file saved") }
  else if (a == "bl") { const was = D.seen || 0; D.seen = Date.now(); save(); newsSheet(was); draw() }
  else if (a == "nx") { const o = $(".ov.nw"); if (o) o.remove() }
  else if (a == "np") { if (!isAdmin()) return; if (!EDIT) return toast("Turn on Edit mode first"); const t1 = $("#nwt").value.trim(), x1 = $("#nwx").value.trim(); if (!t1) return toast("Write a title"); SITE.news = [{ id: Date.now(), t: t1.slice(0, 70), x: x1.slice(0, 240), at: Date.now() }].concat(SITE.news || []).slice(0, 30); await saveSite(); toast("Update published"); draw() }
  else if (a == "nd") { if (!isAdmin()) return; if (!EDIT) return toast("Turn on Edit mode in Control first"); if (!confirm("Delete this update for everyone?")) return; SITE.news = (SITE.news || []).filter(x => String(x.id) != id); await saveSite(); const o = $(".ov.nw"); if (o) o.remove(); draw(); toast("Update deleted") }
  else if (/^tc\d+_\d+$/.test(a)) { const [i, j] = a.slice(2).split("_"), x = D.subs[i].t[j]; x.c = ((x.c || 0) + 1) % 4; save(); draw() }
  else if (/^tx\d+_\d+$/.test(a)) { const [i, j] = a.slice(2).split("_"); D.subs[i].t.splice(j, 1); save(); draw(); toast("Topic removed") }
  else if (/^tf\d+_\d+$/.test(a)) { const i = +a.slice(2).split("_")[0]; T.sub = i; if (!T.on) { T.mode = "f"; T.left = tot() } tab = "study"; draw() }
  else if (/^tm\d+_\d+$/.test(a)) { const [i, k] = a.slice(2).split("_"), nm = (TPL[D.subs[i].n] || [])[k]; if (nm && !D.subs[i].t.some(x => x.n == nm)) { D.subs[i].t.push({ n: nm, d: 0, c: 0 }); save(); draw() } }
  else if (/^cl\d+$/.test(a)) { D.subs[n].t = D.subs[n].t.filter(x => !x.d); save(); draw(); toast("Finished topics removed") }
  else if (a == "lo") logout();
});
document.addEventListener("change", e => {
  if (!U) return;
  const t = e.target, a = t.dataset.a || "";
  if (/^tp\d+_\d+$/.test(a)) { const [i, j] = a.slice(2).split("_"); D.subs[i].t[j].d = t.checked ? 1 : 0; D.td = D.td || {}; const dk = dayk(Date.now()); D.td[dk] = Math.max(0, (D.td[dk] || 0) + (t.checked ? 1 : -1)); save(); draw() }
  else if (/^al\d/.test(a)) { D.alarms.find(x => x.id == +a.slice(2)).on = t.checked ? 1 : 0; save() }
  else if (a == "sl") { D.set.l = +t.checked; save(); theme() }
  else if (a == "snm") { D.set.nm = +t.checked; save(); theme() }
  else if (a == "ssn") { D.set.snd = +t.checked; save() }
  else if (a == "spn") { D.set.pen = +t.checked; save() }
  else if (a == "edt") { EDIT = isAdmin() && t.checked; draw() }
  else if (/^mk\d/.test(a)) { const m = D.mk.find(x => x.id == +a.slice(2)); if (m) { m.ok = t.checked ? 1 : 0; save(); draw() } }
  else if (a == "snt") {
    if (t.checked) { if (!window.Notification) { toast("Notifications not supported"); t.checked = false; return } Notification.requestPermission().then(p => { D.set.nt = p == "granted" ? 1 : 0; t.checked = !!D.set.nt; save(); toast(D.set.nt ? "Notifications on" : "Permission denied") }) }
    else { D.set.nt = 0; save() }
  }
  else if (t.id == "bi") {
    const f = t.files && t.files[0]; if (!f) return; const fr = new FileReader();
    fr.onload = () => { try { const x = JSON.parse(fr.result); if (!x || !Array.isArray(x.subs)) throw 0; D = Object.assign(def(), x); D.set = Object.assign(def().set, x.set || {}); save(); theme(); draw(); toast("Backup restored") } catch (er) { toast("That is not a valid backup file") } };
    fr.readAsText(f); t.value = "";
  }
  else if (t.id == "ts") T.sub = +t.value;
  else if (t.id == "tn") { D.set.tone = t.value; save() }
  else if (t.id == "un") { const v = t.value.trim(); if (v) saveUser({ name: v }) }
  else if (t.id == "pf") {
    const f = t.files && t.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => { const c = document.createElement("canvas"); c.width = c.height = 240; const x = c.getContext("2d"), s = Math.min(im.width, im.height); x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 240, 240); saveUser({ photo: c.toDataURL("image/jpeg", .82) }).then(() => { draw(); toast("Photo updated") }) };
      im.onerror = () => toast("This image format is not supported. Try a JPG or PNG.");
      im.src = fr.result;
    };
    fr.onerror = () => toast("Could not read the photo"); fr.readAsDataURL(f); t.value = "";
  }
});
document.addEventListener("input", e => {
  if (!U) return; const t = e.target;
  if (t.id == "sf") { D.set.f = +t.value; $("#sfv").textContent = t.value; if (!T.on && T.mode == "f") T.left = tot(); save() }
  else if (t.id == "sb") { D.set.b = +t.value; $("#sbv").textContent = t.value; save() }
  else if (t.id == "sg") { D.set.goal = +t.value; $("#sgv").textContent = t.value; save() }
  else if (t.id == "bk") B.k = t.value;
  else if (t.id == "bt") B.t = t.value;
  else if (t.id == "mq") { MQ.q = t.value; const l = $("#ml"); if (l) l.innerHTML = memList() }
});
document.addEventListener("pointerdown", e => {
  if (!D || D.set.nm) return;
  for (let i = 0; i < 6; i++) { const s = document.createElement("i"); s.className = "sp2"; s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px"; s.style.setProperty("--x", (Math.random() * 70 - 35) + "px"); s.style.setProperty("--y", (Math.random() * 70 - 35) + "px"); document.body.append(s); setTimeout(() => s.remove(), 600) }
});
let SNK = null;
setInterval(() => { if (!U || !D || EDIT || tab != "home") return; const k = snLive().map(x => x.id).join(); if (SNK === null) SNK = k; else if (k !== SNK) { SNK = k; draw() } }, 20000);
setInterval(() => { const e = $("#cd"); if (e) e.innerHTML = cdHTML(); chk() }, 1000);
setInterval(() => {
  if (!U) return;
  if (FB ? Date.now() - ls.get("sg_at", 0) > 30 * DAY : (me && Date.now() - me.at >= 30 * DAY)) logout();
}, 6e4);
boot();
