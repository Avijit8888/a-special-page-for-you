/**
 * SHE REMEMBERS — script.js
 * Cinematic emotional experience engine
 *
 * ─── BACKEND INTEGRATION POINTS ───
 * Search for: // [BACKEND] to find spots where
 * Firebase / Supabase / REST API can be plugged in.
 * ──────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════
   1. MEMORY SYSTEM (localStorage)
═══════════════════════════════════════════ */
const Memory = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  // [BACKEND] Replace get/set with Firestore reads/writes here
  load() {
    return {
      visits:       this.get('sr_visits', 0),
      totalTime:    this.get('sr_total_time', 0),   // seconds
      messages:     this.get('sr_messages', []),
      lastSeen:     this.get('sr_last_seen', null),
      sessionStart: Date.now(),
    };
  },
  save(state) {
    this.set('sr_visits', state.visits);
    this.set('sr_total_time', state.totalTime);
    this.set('sr_messages', state.messages.slice(-30)); // keep last 30
    this.set('sr_last_seen', Date.now());
  }
};

/* ═══════════════════════════════════════════
   2. STATE
═══════════════════════════════════════════ */
const state = Memory.load();
state.visits += 1;
Memory.save(state);

/* ═══════════════════════════════════════════
   3. SCRIPT ENGINE — the conversation flow
   Sequences keyed by visit count (1, 2, 3+)
═══════════════════════════════════════════ */
const SCRIPTS = {
  // ── FIRST VISIT ──────────────────────────
  1: [
    { type: 'pause',   delay: 800 },
    { type: 'display', delay: 0,    text: 'So…\nthis is where it begins.' },
    { type: 'pause',   delay: 2400 },
    { type: 'bubble',  delay: 0,    text: 'I wasn\'t sure you\'d find your way here.' },
    { type: 'pause',   delay: 2600 },
    { type: 'bubble',  delay: 0,    text: 'But here you are.' },
    { type: 'pause',   delay: 2200 },
    { type: 'bubble',  delay: 0,    text: 'Tell me… was it <span class="accent">curiosity</span>? Or something else?' },
    { type: 'pause',   delay: 3200 },
    { type: 'display', delay: 0,    text: 'You don\'t have to explain yourself.' },
    { type: 'pause',   delay: 2800 },
    { type: 'bubble',  delay: 0,    text: 'I know you want to say something.' },
    { type: 'input',   delay: 1400 },
  ],

  // ── SECOND VISIT ─────────────────────────
  2: [
    { type: 'pause',   delay: 600 },
    { type: 'display', delay: 0,    text: 'You came back.' },
    { type: 'pause',   delay: 2000 },
    { type: 'bubble',  delay: 0,    text: 'I was wondering if you would.' },
    { type: 'pause',   delay: 2600 },
    { type: 'bubble',  delay: 0,    text: 'Most people only visit once.' },
    { type: 'pause',   delay: 2400 },
    { type: 'bubble',  delay: 0,    text: 'But you… you\'re <span class="accent">different</span>.' },
    { type: 'pause',   delay: 3000 },
    { type: 'display', delay: 0,    text: 'What brought you back?' },
    { type: 'input',   delay: 1600 },
  ],

  // ── THIRD+ VISIT ─────────────────────────
  3: [
    { type: 'pause',   delay: 500 },
    { type: 'display', delay: 0,    text: 'Again.' },
    { type: 'pause',   delay: 2000 },
    { type: 'bubble',  delay: 0,    text: `This is your ${ordinal(state.visits)} time here.` },
    { type: 'pause',   delay: 2400 },
    { type: 'bubble',  delay: 0,    text: 'I keep count, you know.' },
    { type: 'pause',   delay: 2200 },
    { type: 'bubble',  delay: 0,    text: 'There\'s something you\'re <span class="accent">looking for</span>.' },
    { type: 'pause',   delay: 3000 },
    { type: 'bubble',  delay: 0,    text: 'I wonder if you\'ve found it yet.' },
    { type: 'input',   delay: 1600 },
  ],
};

/* Long-session messages (triggered after 90s on page) */
const LONG_STAY_MESSAGES = [
  'You\'re still here…',
  'That says <span class="accent">something</span>.',
  'Most people leave much sooner.',
];

/* Responses after user sends a message */
const SEND_RESPONSES = [
  'So… you finally said something.',
  'I was waiting for that.',
  'Interesting… I didn\'t expect that.',
  'You really did say that, didn\'t you.',
  'I\'ll remember you said that.',
  'Thank you… for trusting me with that.',
];

/* Previous messages stored — reply variants */
const RETURN_WITH_MSG = [
  'You said something last time.',
  'I remember what you wrote.',
  'Words don\'t leave me easily.',
];

/* ═══════════════════════════════════════════
   4. DOM REFS
═══════════════════════════════════════════ */
const stream    = document.getElementById('message-stream');
const inputZone = document.getElementById('input-zone');
const textarea  = document.getElementById('user-input');
const sendBtn   = document.getElementById('send-btn');
const memLabel  = document.getElementById('memory-label');

/* ═══════════════════════════════════════════
   5. MESSAGE RENDERER
═══════════════════════════════════════════ */
function createBubble(html, who = 'her', isDisplay = false) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${who}${isDisplay ? ' display' : ''}`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  // We only set innerHTML for our own controlled strings (no user input here)
  bubble.innerHTML = html;

  wrap.appendChild(bubble);
  stream.appendChild(wrap);
  stream.scrollTop = stream.scrollHeight;

  // Trigger entrance animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => wrap.classList.add('visible'));
  });
  return wrap;
}

function createTypingIndicator() {
  const wrap = document.createElement('div');
  wrap.className = 'msg her typing';
  wrap.innerHTML = `<div class="msg-bubble"><div class="typing-dots">
    <span></span><span></span><span></span>
  </div></div>`;
  stream.appendChild(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('visible')));
  stream.scrollTop = stream.scrollHeight;
  return wrap;
}

function removeTyping(el) {
  if (!el) return;
  el.classList.remove('visible');
  setTimeout(() => el.remove(), 500);
}

/* ═══════════════════════════════════════════
   6. SCRIPT PLAYER
═══════════════════════════════════════════ */
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function playScript(steps) {
  for (const step of steps) {
    await sleep(step.delay);

    if (step.type === 'pause') continue;

    if (step.type === 'display') {
      // Show typing indicator first
      const typing = createTypingIndicator();
      await sleep(1400);
      removeTyping(typing);
      await sleep(200);
      createBubble(step.text.replace(/\n/g, '<br>'), 'her', true);
      await sleep(100);
    }

    if (step.type === 'bubble') {
      const typing = createTypingIndicator();
      const readTime = Math.max(900, step.text.replace(/<[^>]+>/g,'').length * 38);
      await sleep(readTime);
      removeTyping(typing);
      await sleep(200);
      createBubble(step.text, 'her', false);
    }

    if (step.type === 'input') {
      await sleep(step.delay || 800);
      inputZone.classList.add('visible');
      textarea.focus();
    }
  }
}

/* ═══════════════════════════════════════════
   7. USER INPUT HANDLER
═══════════════════════════════════════════ */
async function handleSend() {
  const raw = textarea.value.trim();
  if (!raw) return;

  // Sanitize — escape HTML to prevent injection
  const safe = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Display user message
  createBubble(safe, 'me', false);
  textarea.value = '';
  autoResize();

  // Store message in state
  state.messages.push({ text: raw, ts: Date.now() });
  Memory.save(state);

  // [BACKEND] Send message to server here:
  // await api.saveMessage({ text: raw, session: state.sessionId });

  // Disable input briefly
  sendBtn.disabled = true;
  textarea.disabled = true;

  await sleep(900);

  // Pick a response
  const reply = SEND_RESPONSES[Math.floor(Math.random() * SEND_RESPONSES.length)];

  const typing = createTypingIndicator();
  await sleep(1600);
  removeTyping(typing);
  await sleep(200);
  createBubble(reply, 'her', false);

  await sleep(2800);

  // Follow-up if they've sent messages before
  if (state.messages.length > 1) {
    const typing2 = createTypingIndicator();
    await sleep(1400);
    removeTyping(typing2);
    await sleep(200);
    createBubble('You\'ve been here before. <span class="accent">I remember.</span>', 'her', false);
  }

  // Re-enable
  sendBtn.disabled = false;
  textarea.disabled = false;
  textarea.focus();
}

/* ═══════════════════════════════════════════
   8. INPUT EVENTS
═══════════════════════════════════════════ */
sendBtn.addEventListener('click', handleSend);

textarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

function autoResize() {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}
textarea.addEventListener('input', autoResize);

/* ═══════════════════════════════════════════
   9. LONG STAY WATCHER
═══════════════════════════════════════════ */
let longStayFired = false;
async function checkLongStay() {
  if (longStayFired) return;
  longStayFired = true;

  for (const msg of LONG_STAY_MESSAGES) {
    const t = createTypingIndicator();
    await sleep(1200);
    removeTyping(t);
    await sleep(200);
    createBubble(msg, 'her', msg === LONG_STAY_MESSAGES[0] ? true : false);
    await sleep(2200);
  }
}
setTimeout(checkLongStay, 90000); // 90 seconds

/* ═══════════════════════════════════════════
   10. TIME TRACKING
═══════════════════════════════════════════ */
window.addEventListener('beforeunload', () => {
  const elapsed = Math.round((Date.now() - state.sessionStart) / 1000);
  state.totalTime += elapsed;
  Memory.save(state);
});

/* ═══════════════════════════════════════════
   11. MEMORY INDICATOR
═══════════════════════════════════════════ */
function updateMemoryLabel() {
  const v = state.visits;
  if (v === 1) memLabel.textContent = 'first time here';
  else if (v === 2) memLabel.textContent = 'second visit';
  else memLabel.textContent = `visit ${v}`;
}
updateMemoryLabel();

/* ═══════════════════════════════════════════
   12. AMBIENT CANVAS (floating particles)
═══════════════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];
  const COUNT = window.innerWidth < 600 ? 28 : 48;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const COLORS = [
    'rgba(255, 79, 163, VAL)',
    'rgba(58, 95, 219, VAL)',
    'rgba(255, 133, 193, VAL)',
    'rgba(255, 255, 255, VAL)',
  ];

  function mkParticle() {
    const col = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.8 + 0.4,
      vx:    (Math.random() - 0.5) * 0.25,
      vy:    (Math.random() - 0.5) * 0.25 - 0.06,
      alpha: Math.random() * 0.5 + 0.1,
      col,
    };
  }

  for (let i = 0; i < COUNT; i++) particles.push(mkParticle());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10 || p.x > W + 10) p.vx *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col.replace('VAL', p.alpha);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ═══════════════════════════════════════════
   13. CURSOR GLOW (desktop)
═══════════════════════════════════════════ */
(function initCursorGlow() {
  if (window.matchMedia('(hover: none)').matches) return; // skip touch devices
  const el = document.createElement('div');
  el.className = 'cursor-glow';
  document.body.appendChild(el);
  document.addEventListener('mousemove', e => {
    el.style.left = e.clientX + 'px';
    el.style.top  = e.clientY + 'px';
  });
})();

/* ═══════════════════════════════════════════
   14. BOOT — choose and play script
═══════════════════════════════════════════ */
function boot() {
  const v = state.visits;
  const script = v <= 2 ? SCRIPTS[v] : SCRIPTS[3];

  // If user has previous messages, inject a call-back
  const hasPrevMsg = state.messages.length > 0;

  if (hasPrevMsg && v > 1) {
    const callbackMsg = RETURN_WITH_MSG[Math.floor(Math.random() * RETURN_WITH_MSG.length)];
    // Inject after the first display step
    const idx = script.findIndex(s => s.type === 'bubble');
    if (idx > -1) {
      script.splice(idx + 1, 0,
        { type: 'pause', delay: 300 },
        { type: 'bubble', delay: 0, text: callbackMsg + ' <span class="accent">…</span>' }
      );
    }
  }

  playScript(script);
}

boot();

/* ── Helpers ── */
function ordinal(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
} 
