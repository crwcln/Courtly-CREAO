/* ═══════════════════════════════════════════════════════════
   Courtly. — Main Application Script
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── CONSTANTS ────────────────────────────────────────────────
const COLORS = [
  '#30d158','#0a84ff','#ff375f','#ff9f0a',
  '#bf5af2','#32ade6','#ff453a','#ffd60a'
];

const PHRASES = [
  'Dink it to win it',
  'Kitchen rules',
  'Third shot drop',
  'Stay out of the kitchen',
  'Ace the pace',
  'Poach the court',
  'Pickleball or nothing',
  'Serve. Rally. Win.'
];

// ── UTILITIES ────────────────────────────────────────────────
function getColor(name) {
  let h = 0;
  for (const c of name) h = ((h << 5) - h) + c.charCodeAt(0);
  return COLORS[Math.abs(h) % COLORS.length];
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDuration(ms) {
  const s   = Math.floor(ms / 1000);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function skillBadge(s) {
  return { Pro:'badge-pro', Advanced:'badge-adv', Intermediate:'badge-int', Beginner:'badge-beg' }[s] || 'badge-beg';
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function fmtDateLong(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
}

// ── DATA LAYER ───────────────────────────────────────────────
function loadData(key, def) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : def;
  } catch (e) {
    return def;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// One-time migration: clear all pre-seeded sample data from older builds
if (!localStorage.getItem('courtly_cleared_v4')) {
  localStorage.removeItem('courtly_matches');
  localStorage.removeItem('courtly_tournaments');
  localStorage.removeItem('courtly_players');
  localStorage.removeItem('courtly_matches_cleared_v2');
  localStorage.removeItem('courtly_cleared_v3');
  localStorage.setItem('courtly_cleared_v4', '1');
}

let players     = loadData('courtly_players',     []);
let matches     = loadData('courtly_matches',      []);
let tournaments = loadData('courtly_tournaments',  []);
let settings    = loadData('courtly_settings',     { name: 'You', skill: 'Intermediate', darkMode: false });

// ── LOADING SCREEN ───────────────────────────────────────────
let phraseIdx = 0;

function runLoadingScreen() {
  const ls    = document.getElementById('loading-screen');
  const bar   = document.getElementById('loading-bar');
  const phEl  = document.getElementById('loading-phrase');
  const build = document.getElementById('build-number');
  const app   = document.getElementById('app');
  const dur   = 5000;
  const start = Date.now();

  const phraseTimer = setInterval(() => {
    phEl.style.opacity = 0;
    setTimeout(() => {
      phraseIdx = (phraseIdx + 1) % PHRASES.length;
      phEl.textContent = PHRASES[phraseIdx];
      phEl.style.opacity = 1;
    }, 300);
  }, 1200);

  const barTimer = setInterval(() => {
    const pct = Math.min(((Date.now() - start) / dur) * 100, 100);
    bar.style.width = pct + '%';
    if (pct >= 100) clearInterval(barTimer);
  }, 50);

  setTimeout(() => {
    clearInterval(phraseTimer);
    build.style.opacity = 0;
    ls.classList.add('fade-out');
    setTimeout(() => {
      ls.classList.add('hidden');
      app.classList.remove('hidden');
      sessionStorage.setItem('courtly_loaded', 'true');
    }, 600);
  }, dur);
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyDarkMode();
  loadSettingsPage();
  setGreeting();
  renderDashboard();

  if (sessionStorage.getItem('courtly_loaded') === 'true') {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  } else {
    runLoadingScreen();
  }

  // Sidebar nav listeners
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      showPage(btn.dataset.page);
      closeMobileSidebar();
    });
  });

  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  // Close modals on backdrop click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('active');
    }
  });
});

// ── NAVIGATION ───────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  const navBtn = document.querySelector(`.nav-item[data-page="${name}"]`);
  if (navBtn) navBtn.classList.add('active');

  if (name === 'dashboard')   renderDashboard();
  if (name === 'matches')     renderMatches();
  if (name === 'tournaments') renderTournaments();
  if (name === 'players')     renderPlayers();
  if (name === 'settings')    loadSettingsPage();

  document.getElementById('main').scrollTop = 0;
}

// ── SIDEBAR ──────────────────────────────────────────────────
let sidebarCollapsed = false;

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
}

function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebar-overlay').classList.add('active');
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

// ── DARK MODE ────────────────────────────────────────────────
function applyDarkMode() {
  document.body.classList.toggle('dark', !!settings.darkMode);
  const toggle = document.getElementById('dark-mode-toggle');
  if (toggle) toggle.checked = !!settings.darkMode;
}

function toggleDarkMode() {
  settings.darkMode = document.getElementById('dark-mode-toggle').checked;
  saveData('courtly_settings', settings);
  applyDarkMode();
}

// ── GREETING ─────────────────────────────────────────────────
function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = `${g}, ${settings.name || 'Player'}!`;
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── DASHBOARD ────────────────────────────────────────────────
function renderDashboard() {
  setGreeting();

  const total  = matches.length;
  const wins   = matches.filter(m => m.outcome === 'win').length;
  const wr     = total ? Math.round((wins / total) * 100) : 0;
  const streak = calcStreak();
  const avg    = total ? (matches.reduce((a, m) => a + m.p1score, 0) / total).toFixed(1) : '0.0';

  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Matches</div>
      <div class="stat-value">${total}</div>
      <div class="stat-sub">All time</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Win Rate</div>
      <div class="stat-value" style="color:var(--accent)">${wr}%</div>
      <div class="stat-sub">${wins}W · ${total - wins}L</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Current Streak</div>
      <div class="stat-value" style="color:${streak >= 0 ? 'var(--accent)' : 'var(--red)'}">
        ${streak >= 0 ? '+' : ''}${streak}
      </div>
      <div class="stat-sub">${streak >= 0 ? 'Win streak' : 'Losing streak'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Points</div>
      <div class="stat-value">${avg}</div>
      <div class="stat-sub">Per match</div>
    </div>
  `;

  const sorted = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  document.getElementById('dash-recent-matches').innerHTML = sorted.length
    ? sorted.map(matchCardHTML).join('')
    : `<div class="empty-state">
         <div class="icon">🏓</div>
         <h3>No matches yet</h3>
         <p>Start your first match to track your progress</p>
       </div>`;
}

function calcStreak() {
  const sorted = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!sorted.length) return 0;
  const dir = sorted[0].outcome;
  let s = 0;
  for (const m of sorted) {
    if (m.outcome === dir) s++;
    else break;
  }
  return dir === 'win' ? s : -s;
}

// ── MATCHES ──────────────────────────────────────────────────
function matchCardHTML(m) {
  const opp   = m.p2 === 'You' ? m.p1 : m.p2;
  const date  = fmtDate(m.date);
  const score = `${m.p1score}–${m.p2score}`;
  return `
    <div class="match-card">
      <div class="match-outcome ${m.outcome}"></div>
      <div class="match-info">
        <div class="match-opp">vs ${opp}</div>
        <div class="match-date">${date}${m.location ? ' · ' + m.location : ''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <div class="match-score">${score}</div>
        <span class="badge badge-${m.outcome}">${m.outcome === 'win' ? 'Win' : 'Loss'}</span>
      </div>
    </div>`;
}

function renderMatches(filtered) {
  const list   = filtered || matches;
  const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('matches-list').innerHTML = sorted.length
    ? sorted.map(matchCardHTML).join('')
    : `<div class="empty-state">
         <div class="icon">🏓</div>
         <h3>No matches found</h3>
         <p>Try clearing your filters or recording a new match</p>
       </div>`;
}

function applyFilters() {
  const opp  = document.getElementById('filter-opponent').value.toLowerCase().trim();
  const from = document.getElementById('filter-date-from').value;
  const to   = document.getElementById('filter-date-to').value;
  const outc = document.getElementById('filter-outcome').value;

  let filtered = matches;
  if (opp)  filtered = filtered.filter(m => (m.p2 === 'You' ? m.p1 : m.p2).toLowerCase().includes(opp));
  if (from) filtered = filtered.filter(m => m.date >= from);
  if (to)   filtered = filtered.filter(m => m.date <= to);
  if (outc) filtered = filtered.filter(m => m.outcome === outc);

  renderMatches(filtered);
}

function clearFilters() {
  ['filter-opponent', 'filter-date-from', 'filter-date-to'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('filter-outcome').value = '';
  renderMatches();
}

// ── TOURNAMENTS ──────────────────────────────────────────────
function renderTournaments() {
  const el = document.getElementById('tournament-list');
  if (!tournaments.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="icon">🏆</div>
      <h3>No tournaments yet</h3>
      <p>Create your first tournament to get started</p>
    </div>`;
    return;
  }

  const statusMap = {
    upcoming: 'badge-upcoming Upcoming',
    progress: 'badge-progress In Progress',
    done:     'badge-done Completed'
  };

  el.innerHTML = tournaments.map(t => {
    const [cls, lbl] = (statusMap[t.status] || 'badge-done Completed').split(' ');
    const fmtLabel = t.format === 'single' ? 'Single Elim'
                   : t.format === 'double' ? 'Double Elim'
                   : 'Round Robin';
    return `
      <div class="tournament-card" onclick="viewTournament('${t.id}')">
        <div class="t-icon">🏆</div>
        <div class="t-info">
          <div class="t-name">${t.name}</div>
          <div class="t-meta">${fmtDateLong(t.date)} · ${t.players.length} players · ${fmtLabel}</div>
        </div>
        <span class="badge ${cls}">${lbl}</span>
      </div>`;
  }).join('');
}

function viewTournament(id) {
  const t = tournaments.find(x => x.id === id);
  if (!t) return;

  const statusMap = {
    upcoming: 'badge-upcoming Upcoming',
    progress: 'badge-progress In Progress',
    done:     'badge-done Completed'
  };
  const [cls, lbl] = (statusMap[t.status] || 'badge-done Completed').split(' ');
  const fmtLabel   = t.format === 'single' ? 'Single Elimination'
                   : t.format === 'double' ? 'Double Elimination'
                   : 'Round Robin';

  const r1    = t.matches.filter((_, i) => i < 2);
  const final = t.matches[2];

  let bracketHTML = `<div class="bracket-container"><div class="bracket">`;
  bracketHTML += `<div class="bracket-round"><div class="round-label">Semifinals</div>`;
  r1.forEach(bm => { bracketHTML += bracketMatchHTML(bm, t.id); });
  bracketHTML += `</div>`;
  bracketHTML += `<div class="bracket-round" style="justify-content:center;margin-top:60px;"><div class="round-label">Final</div>`;
  bracketHTML += bracketMatchHTML(final, t.id);
  bracketHTML += `</div></div></div>`;

  const playerChips = t.players.map(p => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;
                background:var(--bg3);border-radius:100px;font-size:0.85rem;">
      <div class="avatar" style="width:28px;height:28px;font-size:0.7rem;background:${getColor(p)}">
        ${initials(p)}
      </div>
      ${p}
    </div>`).join('');

  document.getElementById('tournament-detail-content').innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">${t.name}</div>
        <div class="page-subtitle">${fmtDateLong(t.date)} · ${fmtLabel}</div>
      </div>
      <span class="badge ${cls}">${lbl}</span>
    </div>
    <div class="card" style="margin-bottom:20px;">
      <div class="section-title" style="margin-bottom:12px;">Players</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">${playerChips}</div>
    </div>
    <div class="section-title">Bracket</div>
    ${bracketHTML}`;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-tournament-detail').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('.nav-item[data-page="tournaments"]').classList.add('active');
}

function bracketMatchHTML(bm, tid) {
  if (!bm || !bm.p1) {
    return `<div class="bracket-match" style="opacity:0.3;">
      <div class="bracket-player">TBD</div>
      <div class="bracket-player">TBD</div>
    </div>`;
  }
  const p1win = bm.played && bm.p1score > bm.p2score;
  const p2win = bm.played && bm.p2score > bm.p1score;
  return `
    <div class="bracket-match" onclick="openBracketScoreModal('${bm.id}','${tid}')">
      <div class="bracket-player ${p1win ? 'winner' : ''}">
        <span>${bm.p1}</span>
        <span class="bracket-player-score">${bm.played ? bm.p1score : '-'}</span>
      </div>
      <div class="bracket-player ${p2win ? 'winner' : ''}">
        <span>${bm.p2}</span>
        <span class="bracket-player-score">${bm.played ? bm.p2score : '-'}</span>
      </div>
    </div>`;
}

// Bracket score modal state
let activeBracketMatch = null;
let activeTournamentId = null;

function openBracketScoreModal(bmId, tid) {
  const t  = tournaments.find(x => x.id === tid);
  const bm = t && t.matches.find(x => x.id === bmId);
  if (!bm || !bm.p1) return;

  activeBracketMatch = bm;
  activeTournamentId = tid;

  document.getElementById('bracket-score-subtitle').textContent = `${bm.p1} vs ${bm.p2}`;
  document.getElementById('bracket-p1-label').textContent       = bm.p1;
  document.getElementById('bracket-p2-label').textContent       = bm.p2;
  document.getElementById('bracket-score-p1').value = bm.played ? bm.p1score : '';
  document.getElementById('bracket-score-p2').value = bm.played ? bm.p2score : '';
  openModal('bracket-score-modal');
}

function saveBracketScore() {
  if (!activeBracketMatch) return;
  const s1 = parseInt(document.getElementById('bracket-score-p1').value);
  const s2 = parseInt(document.getElementById('bracket-score-p2').value);
  if (isNaN(s1) || isNaN(s2)) return;

  activeBracketMatch.p1score = s1;
  activeBracketMatch.p2score = s2;
  activeBracketMatch.played  = true;

  const t        = tournaments.find(x => x.id === activeTournamentId);
  const allPlayed = t.matches.every(m => m.played);
  t.status = allPlayed ? 'done' : 'progress';

  saveData('courtly_tournaments', tournaments);
  closeModal('bracket-score-modal');
  viewTournament(activeTournamentId);
}

function openCreateTournamentModal() {
  const tags = document.getElementById('t-player-tags');
  tags.innerHTML = players.map(p =>
    `<button class="tag" onclick="this.classList.toggle('selected')">${p.name}</button>`
  ).join('');

  document.getElementById('t-name').value  = '';
  document.getElementById('t-date').value  = '';
  document.getElementById('t-format').value = 'single';
  openModal('create-tournament-modal');
}

function createTournament() {
  const name            = document.getElementById('t-name').value.trim();
  const date            = document.getElementById('t-date').value;
  const fmt             = document.getElementById('t-format').value;
  const selectedPlayers = Array.from(
    document.querySelectorAll('#t-player-tags .tag.selected')
  ).map(t => t.textContent);

  if (!name || !date) return;
  if (selectedPlayers.length < 2) { alert('Select at least 2 players.'); return; }

  const bmatches = [];
  for (let i = 0; i < selectedPlayers.length - 1; i += 2) {
    if (selectedPlayers[i + 1]) {
      bmatches.push({
        id: `bm${Date.now()}_${i}`,
        p1: selectedPlayers[i],
        p2: selectedPlayers[i + 1],
        p1score: null, p2score: null, played: false
      });
    }
  }
  bmatches.push({ id: `bm${Date.now()}_final`, p1: null, p2: null, p1score: null, p2score: null, played: false });

  tournaments.push({ id: 't' + Date.now(), name, date, format: fmt, status: 'upcoming', players: selectedPlayers, matches: bmatches });
  saveData('courtly_tournaments', tournaments);
  closeModal('create-tournament-modal');
  renderTournaments();
}

// ── PLAYERS ──────────────────────────────────────────────────
function renderPlayers() {
  const grid = document.getElementById('players-grid');
  if (!players.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="icon">👥</div>
      <h3>No players yet</h3>
      <p>Add your first player to get started</p>
    </div>`;
    return;
  }

  grid.innerHTML = players.map(p => `
    <div class="player-card" onclick="viewPlayer('${p.id}')">
      ${p.photo
        ? `<img src="${p.photo}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">`
        : `<div class="avatar" style="background:${getColor(p.name)}">${initials(p.name)}</div>`}
      <div class="player-name">${p.name}</div>
      <span class="badge ${skillBadge(p.skill)}">${p.skill}</span>
      <div class="player-stat">${p.wins}W · ${p.losses}L</div>
      <div class="player-stat">${p.matches ? Math.round((p.wins / p.matches) * 100) + '% win rate' : '0% win rate'}</div>
    </div>`
  ).join('');
}

function viewPlayer(id) {
  const p = players.find(x => x.id === id);
  if (!p) return;

  const wr = p.matches ? Math.round((p.wins / p.matches) * 100) : 0;
  const pm = matches.filter(m => m.p2 === p.name || m.p1 === p.name);

  document.getElementById('player-profile-content').innerHTML = `
    <div class="profile-header">
      ${p.photo
        ? `<img src="${p.photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;">`
        : `<div class="avatar avatar-lg" style="background:${getColor(p.name)}">${initials(p.name)}</div>`}
      <div class="profile-info">
        <div class="profile-name">${p.name}</div>
        <div class="profile-skill" style="margin-top:6px;">
          <span class="badge ${skillBadge(p.skill)}">${p.skill}</span>
        </div>
      </div>
      <button class="btn btn-ghost" onclick="openEditPlayerModal('${p.id}')">Edit Profile</button>
    </div>
    <div class="profile-stats">
      <div class="stat-card"><div class="stat-label">Wins</div><div class="stat-value" style="color:var(--accent)">${p.wins}</div></div>
      <div class="stat-card"><div class="stat-label">Losses</div><div class="stat-value" style="color:var(--red)">${p.losses}</div></div>
      <div class="stat-card"><div class="stat-label">Win Rate</div><div class="stat-value">${wr}%</div></div>
      <div class="stat-card"><div class="stat-label">Avg Score</div><div class="stat-value">${p.avgScore || '—'}</div></div>
    </div>
    <div class="section-title">Match History</div>
    <div class="match-list">
      ${pm.length
        ? pm.sort((a, b) => new Date(b.date) - new Date(a.date)).map(matchCardHTML).join('')
        : '<div class="empty-state"><div class="icon">🏓</div><h3>No matches recorded</h3></div>'}
    </div>`;

  document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active'));
  document.getElementById('page-player-profile').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('.nav-item[data-page="players"]').classList.add('active');
}

let editingPlayerId = null;
let pendingPhotoData = null;

function openAddPlayerModal() {
  editingPlayerId  = null;
  pendingPhotoData = null;
  document.getElementById('player-modal-title').textContent = 'Add Player';
  document.getElementById('player-modal-sub').textContent   = 'Add a new player to your roster.';
  document.getElementById('pm-save-btn').textContent        = 'Add Player';
  document.getElementById('pm-name').value                  = '';
  document.getElementById('pm-skill').value                 = 'Intermediate';
  document.getElementById('pm-photo-preview').textContent   = '';
  openModal('player-modal');
}

function openEditPlayerModal(id) {
  const p = players.find(x => x.id === id);
  if (!p) return;

  editingPlayerId  = id;
  pendingPhotoData = null;
  document.getElementById('player-modal-title').textContent = 'Edit Profile';
  document.getElementById('player-modal-sub').textContent   = `Editing ${p.name}`;
  document.getElementById('pm-save-btn').textContent        = 'Save Changes';
  document.getElementById('pm-name').value                  = p.name;
  document.getElementById('pm-skill').value                 = p.skill;
  document.getElementById('pm-photo-preview').textContent   = p.photo ? 'Photo loaded' : '';
  openModal('player-modal');
}

function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingPhotoData = ev.target.result;
    document.getElementById('pm-photo-preview').textContent = '✓ Photo selected: ' + file.name;
  };
  reader.readAsDataURL(file);
}

function savePlayer() {
  const name  = document.getElementById('pm-name').value.trim();
  const skill = document.getElementById('pm-skill').value;
  if (!name) return;

  if (editingPlayerId) {
    const p = players.find(x => x.id === editingPlayerId);
    if (p) {
      p.name  = name;
      p.skill = skill;
      if (pendingPhotoData) p.photo = pendingPhotoData;
    }
  } else {
    players.push({
      id: 'p' + Date.now(), name, skill,
      photo: pendingPhotoData || null,
      wins: 0, losses: 0, matches: 0, avgScore: 0
    });
  }

  saveData('courtly_players', players);
  closeModal('player-modal');
  if (editingPlayerId) viewPlayer(editingPlayerId);
  else renderPlayers();
}

// ── SETTINGS ─────────────────────────────────────────────────
function loadSettingsPage() {
  const nameEl  = document.getElementById('settings-name');
  const skillEl = document.getElementById('settings-skill');
  if (nameEl)  nameEl.value  = settings.name  || '';
  if (skillEl) skillEl.value = settings.skill || 'Intermediate';
  applyDarkMode();
}

function saveSettings() {
  settings.name  = document.getElementById('settings-name').value;
  settings.skill = document.getElementById('settings-skill').value;
  saveData('courtly_settings', settings);
  setGreeting();
}

// ── MATCH OVERLAY ─────────────────────────────────────────────
let matchState = {
  running: false, p1: 0, p2: 0,
  p1name: '', p2name: '', location: '',
  startTime: null, elapsed: 0, timerInterval: null
};

function openMatchPanel() {
  document.getElementById('match-overlay').classList.add('active');
  document.getElementById('match-setup').style.display        = 'flex';
  document.getElementById('live-scoreboard').style.display    = 'none';
  document.getElementById('ms-p1').value                      = settings.name || 'You';
  document.getElementById('ms-p2').value                      = '';
  document.getElementById('ms-location').value                = '';
  document.getElementById('match-timer').textContent          = '00:00:00';
  resetMatchState();
}

function closeMatchPanel() {
  stopTimer();
  document.getElementById('match-overlay').classList.remove('active');
  resetMatchState();
}

function resetMatchState() {
  matchState = {
    running: false, p1: 0, p2: 0,
    p1name: '', p2name: '', location: '',
    startTime: null, elapsed: 0, timerInterval: null
  };
}

function startLiveMatch() {
  const p1n = document.getElementById('ms-p1').value.trim()       || 'Player 1';
  const p2n = document.getElementById('ms-p2').value.trim()       || 'Opponent';
  const loc  = document.getElementById('ms-location').value.trim();

  Object.assign(matchState, { p1name: p1n, p2name: p2n, location: loc, p1: 0, p2: 0, running: true, startTime: Date.now() });

  document.getElementById('live-p1-name').textContent         = p1n;
  document.getElementById('live-p2-name').textContent         = p2n;
  document.getElementById('live-p1-score').textContent        = '0';
  document.getElementById('live-p2-score').textContent        = '0';
  document.getElementById('match-overlay-subtitle').textContent = `${p1n} vs ${p2n}`;
  document.getElementById('match-location-display').textContent = loc ? '📍 ' + loc : '';
  document.getElementById('match-setup').style.display         = 'none';
  document.getElementById('live-scoreboard').style.display     = 'flex';

  startTimer();
}

function startTimer() {
  stopTimer();
  matchState.timerInterval = setInterval(() => {
    matchState.elapsed = Date.now() - matchState.startTime;
    document.getElementById('match-timer').textContent = formatDuration(matchState.elapsed);
  }, 500);
}

function stopTimer() {
  if (matchState.timerInterval) clearInterval(matchState.timerInterval);
  matchState.timerInterval = null;
}

function updateScore(player, delta) {
  if (!matchState.running) return;
  if (player === 1) {
    matchState.p1 = Math.max(0, matchState.p1 + delta);
    document.getElementById('live-p1-score').textContent = matchState.p1;
  } else {
    matchState.p2 = Math.max(0, matchState.p2 + delta);
    document.getElementById('live-p2-score').textContent = matchState.p2;
  }
}

function endMatch() {
  if (!matchState.running) { closeMatchPanel(); return; }
  stopTimer();

  const dur     = formatDuration(matchState.elapsed);
  const outcome = matchState.p1 >= matchState.p2 ? 'win' : 'loss';
  const color   = outcome === 'win' ? 'var(--accent)' : 'var(--red)';
  const result  = outcome === 'win' ? 'Victory' : 'Defeat';

  document.getElementById('match-summary-content').innerHTML = `
    <div class="summary-row"><span>Match</span><span>${matchState.p1name} vs ${matchState.p2name}</span></div>
    <div class="summary-row"><span>Score</span><span>${matchState.p1} – ${matchState.p2}</span></div>
    <div class="summary-row"><span>Outcome</span><span style="color:${color}">${result}</span></div>
    <div class="summary-row"><span>Duration</span><span>${dur}</span></div>
    ${matchState.location ? `<div class="summary-row"><span>Location</span><span>${matchState.location}</span></div>` : ''}
    <div class="summary-row"><span>Date</span><span>${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span></div>`;

  openModal('submit-match-modal');
}

function submitMatch() {
  const dur     = formatDuration(matchState.elapsed);
  const outcome = matchState.p1 >= matchState.p2 ? 'win' : 'loss';

  const newMatch = {
    id: 'm' + Date.now(),
    p1: matchState.p1name, p2: matchState.p2name,
    p1score: matchState.p1, p2score: matchState.p2,
    date: new Date().toISOString().split('T')[0],
    outcome, duration: dur, location: matchState.location
  };

  matches.push(newMatch);
  saveData('courtly_matches', matches);

  const oppPlayer = players.find(p => p.name === matchState.p2name);
  if (oppPlayer) {
    oppPlayer.matches = (oppPlayer.matches || 0) + 1;
    if (outcome === 'win') oppPlayer.losses++;
    else oppPlayer.wins++;
    saveData('courtly_players', players);
  }

  closeModal('submit-match-modal');
  closeMatchPanel();
  showPage('dashboard');
}

function discardMatch() {
  closeModal('submit-match-modal');
  closeMatchPanel();
}

// ── MODAL HELPERS ─────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
Todo
