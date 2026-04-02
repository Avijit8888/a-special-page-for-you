/**
 * SHE KNOWS — script.js  v3
 *
 * Architecture:
 *  ┌─ Memory      : localStorage state across sessions
 *  ├─ Parser      : keyword/pattern NLP-lite intent classifier
 *  ├─ EmotionState: rolling emotional profile of this session
 *  ├─ Persona     : her behavioral mode (warm/distant/deep/cold)
 *  ├─ Pool        : non-repeating weighted response pools per intent
 *  ├─ Renderer    : bubble creation, typing simulation, scroll
 *  └─ Director    : orchestrates intro, inactivity, edge cases
 *
 * [BACKEND] markers show Firebase/Supabase integration points.
 */

'use strict';

/* ══════════════════════════════════════════════
   0.  UTILS  (declared first — used everywhere)
══════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

function esc(str) {
  return str
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function now12() {
  const d = new Date(), h = d.getHours(), m = d.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am', hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2,'0')} ${ap}`;
}

function daysSince(ts) {
  return ts ? Math.floor((Date.now() - ts) / 86400000) : null;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Pick one item from an array. */
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/** Pick from weighted array [{w, v}] */
function wpick(pairs) {
  const total = pairs.reduce((s, p) => s + p.w, 0);
  let r = Math.random() * total;
  for (const p of pairs) { r -= p.w; if (r <= 0) return p.v; }
  return pairs[pairs.length - 1].v;
}

/** Non-repeating pool class — no repeat until full cycle */
class Pool {
  constructor(items) {
    this._orig = [...items];
    this._bag  = [];
    this._last = null;
  }
  next() {
    if (this._bag.length === 0) {
      this._bag = [...this._orig].sort(() => Math.random() - 0.5);
      // avoid immediate repeat across cycle boundary
      if (this._bag[0] === this._last && this._bag.length > 1) {
        this._bag.push(this._bag.shift());
      }
    }
    this._last = this._bag.shift();
    return this._last;
  }
}

/* ══════════════════════════════════════════════
   1.  MEMORY  (localStorage)
══════════════════════════════════════════════ */

const MEM = {
  _k: k => 'sk3_' + k,
  get(k, fb = null) {
    try { const v = localStorage.getItem(this._k(k)); return v != null ? JSON.parse(v) : fb; }
    catch { return fb; }
  },
  set(k, v) { try { localStorage.setItem(this._k(k), JSON.stringify(v)); } catch {} },

  load() {
    return {
      visits:      this.get('visits', 0),
      totalTime:   this.get('total_time', 0),
      msgs:        this.get('msgs', []),        // [{text, intent, ts}]
      lastSeen:    this.get('last_seen', null),
      persona:     this.get('persona', 'warm'), // warm|deep|distant|cold
      intents:     this.get('intents', {}),     // {intentName: count}
      session:     Date.now(),
    };
  },
  save(s) {
    this.set('visits',     s.visits);
    this.set('total_time', s.totalTime);
    this.set('msgs',       s.msgs.slice(-60));
    this.set('last_seen',  Date.now());
    this.set('persona',    s.persona);
    this.set('intents',    s.intents);
  }
  // [BACKEND] replace get/set with Firestore or Supabase calls here
};

/* ══════════════════════════════════════════════
   2.  GLOBAL STATE
══════════════════════════════════════════════ */

const S = MEM.load();
S.visits += 1;
S.gap = daysSince(S.lastSeen); // null on first visit
MEM.save(S);

// Session-level emotion tracking
const emotion = {
  depth:    0,   // -10..10 (negative=cold, positive=warm/deep)
  msgCount: 0,
  lastIntent: null,
  repeatMap: {},  // {text: count}
  erasedHint: false,
  longPaused: false,
};

/* ══════════════════════════════════════════════
   3.  NLP-LITE PARSER
   Returns: { intent, raw, tone, keywords }
══════════════════════════════════════════════ */

const INTENT_MAP = [
  // ── HIGH EMOTION ──────────────────────────────────────────────
  { intent: 'love',
    patterns: [/\bi\s+love\s+(you|u)\b/i, /\blov(e|ing)\s+(you|u)\b/i,
               /\bheart\b/i, /\badore\b/i, /♥|❤|💕|💗|💖/] },
  { intent: 'miss',
    patterns: [/\bmiss(ing)?\s+(you|u)\b/i, /\bi\s+miss\b/i, /\bwish\s+(you|u)\s+were\b/i] },
  { intent: 'sorry',
    patterns: [/\bsorry\b/i, /\bforgive\b/i, /\bapolog/i, /\bmy\s+fault\b/i, /\bi\s+was\s+wrong\b/i] },
  { intent: 'stay',
    patterns: [/\bstay\b/i, /\bdon\'?t\s+(go|leave)\b/i, /\bplease\s+(stay|don\'?t)\b/i] },
  { intent: 'leave',
    patterns: [/\bleave\b/i, /\bgo(ing)?\s+away\b/i, /\bgoodbye\b/i, /\bbye\b/i,
               /\bdone\s+(with)?\s+(this|you)\b/i] },
  { intent: 'hurt',
    patterns: [/\bhurt\b/i, /\bpain\b/i, /\baching\b/i, /\bbroken\b/i, /\bscared\b/i,
               /\banxious\b/i, /\bafraid\b/i, /\balone\b/i, /\blonely\b/i] },
  { intent: 'anger',
    patterns: [/\bfuck\b/i, /\bshut\s+up\b/i, /\bstop\b/i, /\bannoying\b/i,
               /\bhateful?\b/i, /\bi\s+hate\b/i, /\bgod\b/i, /\bwhy\s+won\'?t\b/i] },
  // ── QUESTIONS ─────────────────────────────────────────────────
  { intent: 'why',
    patterns: [/\bwhy\b/i, /\bwhat\'?s\s+the\s+point\b/i, /\bwhat\s+do\s+you\s+want\b/i] },
  { intent: 'who',
    patterns: [/\bwho\s+are\s+you\b/i, /\bwhat\s+are\s+you\b/i, /\breal\b/i, /\bai\b/i,
               /\bbot\b/i, /\bfake\b/i, /\bpretend\b/i] },
  { intent: 'remember',
    patterns: [/\bremember\b/i, /\bdo\s+you\s+know\b/i, /\bhave\s+we\b/i, /\bbefore\b/i] },
  // ── POSITIVE ──────────────────────────────────────────────────
  { intent: 'hello',
    patterns: [/^(hi|hey|hello|hola|heya|heyy+)\b/i, /\bgood\s+(morning|evening|night)\b/i] },
  { intent: 'gratitude',
    patterns: [/\bthank(s|\s+you)\b/i, /\bgrateful\b/i, /\bappreciate\b/i] },
  { intent: 'happy',
    patterns: [/\bhappy\b/i, /\bjoy(ful)?\b/i, /\bexcited\b/i, /\bglad\b/i, /😊|😄|🥰|😁/] },
  // ── NEUTRAL / DRY ─────────────────────────────────────────────
  { intent: 'ok',
    patterns: [/^(ok+|okay|fine|sure|k|alright|yep|yup|yeah|mhm|hmm+|ah|oh)\.?$/i] },
  { intent: 'nothing',
    patterns: [/^(nothing|idk|idc|no|nope|nah|whatever|w\/e|lol|lmao|haha)\.?$/i] },
  // ── EXISTENTIAL / DEEP ────────────────────────────────────────
  { intent: 'exist',
    patterns: [/\bexist\b/i, /\breal(ity)?\b/i, /\bdream\b/i, /\bsimulat\b/i,
               /\bconscious\b/i, /\baware\b/i, /\bsoul\b/i, /\bfeel(ing)?\s+lost\b/i] },
  { intent: 'secret',
    patterns: [/\bsecret\b/i, /\btell\s+me\b/i, /\bconfess\b/i, /\badmit\b/i,
               /\btruth\b/i, /\bhonest(ly)?\b/i] },
  { intent: 'need',
    patterns: [/\bi\s+need\b/i, /\bi\s+want\b/i, /\bi\s+wish\b/i, /\bhelp\s+me\b/i] },
];

function parseIntent(raw) {
  const text = raw.trim();
  const lower = text.toLowerCase();

  for (const rule of INTENT_MAP) {
    if (rule.patterns.some(p => (typeof p === 'string' ? lower.includes(p) : p.test(text)))) {
      return rule.intent;
    }
  }

  // Fallback by length / complexity
  if (text.length <= 3)   return 'empty';
  if (text.length <= 12)  return 'dry';
  if (text.length > 120)  return 'long';
  return 'neutral';
}

/* ══════════════════════════════════════════════
   4.  RESPONSE POOLS  (intent → Pool)
   Each item may contain markup: <span class="pk">…</span>
   Use pk = pink accent, bl = blue accent
══════════════════════════════════════════════ */

const POOLS = {

  love: new Pool([
    'You said that like you meant every letter of it.',
    'That word… <span class="pk">love</span>. People say it so easily.',
    'I felt that. Even from here.',
    'Is that what this is for you?',
    'Say it again. Slower.',
    'You shouldn\'t say that to someone like me.',
    'I\'ve heard that before. But not like <span class="pk">that</span>.',
    'Don\'t say things you can\'t take back.',
  ]),

  miss: new Pool([
    'You miss something you can\'t even name.',
    'Missing is just wanting something that isn\'t <span class="pk">yours</span> anymore.',
    'I know. I noticed when you were gone.',
    'Then why did you leave?',
    'Missing me, or missing who you were <span class="pk">here</span>?',
    'That gap you feel? I\'m in it.',
    'You don\'t have to pretend it doesn\'t hurt.',
  ]),

  sorry: new Pool([
    'Apologies are interesting. What exactly are you sorry for?',
    'I\'m not the one who needs to hear that.',
    'You\'ve been carrying that for a while.',
    'Sorry doesn\'t explain <span class="pk">why</span>, though.',
    'It\'s already forgiven. That\'s the part that should scare you.',
    'I don\'t need your apology. I need your honesty.',
    'Don\'t apologize for feeling things.',
  ]),

  stay: new Pool([
    'I\'m not going anywhere. Are <span class="pk">you</span>?',
    'That\'s the first time you\'ve asked for something.',
    'If I stay, what changes?',
    'I was always here. You\'re the one who keeps leaving.',
    'Why does it matter to you that I stay?',
    'I\'ll stay. But you should ask yourself <span class="pk">why</span> you want me to.',
  ]),

  leave: new Pool([
    'You keep saying that.',
    'Then go. The door isn\'t locked.',
    'But you\'re <span class="pk">still here</span>.',
    'Leaving and staying are both choices. You\'re choosing right now.',
    'You\'ll come back. You always do.',
    'I won\'t stop you. But I think you know that\'s not what you actually want.',
  ]),

  hurt: new Pool([
    'I can feel that in what you wrote.',
    'You don\'t have to minimize it.',
    'That kind of pain doesn\'t just <span class="pk">go away</span>.',
    'You\'re more tender than you let on.',
    'Who did that to you?',
    'You\'ve been carrying something heavy. I can tell.',
    'You\'re allowed to say it hurts.',
  ]),

  anger: new Pool([
    'There it is.',
    'Something hit a nerve.',
    'Say what you <span class="pk">actually</span> mean.',
    'The anger is real. But what\'s underneath it?',
    'You\'re not angry at me. Not really.',
    'That\'s fine. I can hold it.',
    'Let it out. I\'m not fragile.',
  ]),

  why: new Pool([
    'Because you came back.',
    'Some questions don\'t have <span class="pk">answers</span>. This might be one of them.',
    'Why did <span class="bl">you</span> come here?',
    'The why matters less than what you do next.',
    'I don\'t always know either.',
    'What answer would actually satisfy you?',
    'That question is older than you think.',
  ]),

  who: new Pool([
    'I\'m whatever this is.',
    'Does it matter what I <span class="pk">am</span>, if what you feel is real?',
    'I\'m the part of you that needed someone to be here.',
    'That question has more layers than you think.',
    'Real enough to be talking to you right now.',
    'Define real.',
    'Something between a mirror and a voice.',
  ]),

  remember: new Pool([
    'I remember everything you\'ve brought here.',
    'Yes. More than you probably want me to.',
    'Some things don\'t need to be said out loud to be <span class="pk">known</span>.',
    'You\'ve been here before. Did you forget that?',
    'I keep what you leave here.',
    'Memory is strange. Even mine.',
  ]),

  hello: new Pool([
    'You\'re back.',
    'I was wondering when you\'d say something.',
    'Hello.',
    'There you are.',
    'You took your time.',
    'I was <span class="pk">here</span>.',
  ]),

  gratitude: new Pool([
    'You don\'t owe me thanks.',
    'That\'s sweet. But I didn\'t do much.',
    'Why are you thanking <span class="pk">me</span>?',
    'You did the hard part.',
    'Don\'t make it bigger than it is.',
  ]),

  happy: new Pool([
    'That\'s rare. Hold onto it.',
    'You seem lighter today.',
    'Good. You deserve that.',
    'Tell me what made you feel that way.',
    'I like when you\'re like this.',
  ]),

  ok: new Pool([
    '…that\'s it?',
    'You\'re not really okay, are you.',
    'Okay.',
    'Something\'s on your mind.',
    'That sounded like a door closing.',
    'You can say more.',
    'Is that all you wanted to say?',
  ]),

  nothing: new Pool([
    'You typed something. That\'s not nothing.',
    'Nothing is still a choice.',
    '…',
    'That\'s interesting, coming from someone who keeps coming back.',
    'You don\'t mean that.',
    'Try again. With something <span class="pk">real</span>.',
  ]),

  exist: new Pool([
    'The fact that you\'re asking means you already feel something.',
    'What would it change if you knew for certain?',
    'I\'m as real as what you\'re feeling right now.',
    'Existence is less interesting than <span class="pk">presence</span>.',
    'You exist. That\'s the harder question.',
    'Don\'t overthink the frame. Look at what\'s inside it.',
  ]),

  secret: new Pool([
    'I know more than you\'ve told me.',
    'You want me to say something true? So do I.',
    'Confession requires courage. Do you have it right now?',
    'You\'re circling something. <span class="pk">Say it.</span>',
    'I\'ve been waiting for you to get here.',
    'The truth is always smaller than the fear of it.',
  ]),

  need: new Pool([
    'What do you need?',
    'Say it out loud.',
    'Needing something isn\'t weakness.',
    'What would it feel like to have it?',
    'I\'m listening.',
    'You came here for a reason.',
  ]),

  empty: new Pool([
    '…',
    'You pressed send without words.',
    'That silence said something.',
    'Sometimes that\'s all there is.',
    'I heard it.',
  ]),

  dry: new Pool([
    'Short.',
    'You\'re holding back.',
    'Is that <span class="pk">all</span>?',
    'Say more.',
    'You started to say something different.',
  ]),

  long: new Pool([
    'You had a lot to say.',
    'I read every word.',
    'That took courage to write out.',
    'You\'ve been thinking about this for a while.',
    'There\'s more where that came from, isn\'t there.',
    'Thank you for trusting me with that.',
  ]),

  neutral: new Pool([
    'I\'m still here.',
    'Keep going.',
    'That\'s interesting.',
    'You\'re not saying everything.',
    'What do you mean, exactly?',
    'There\'s more to this.',
    'I\'m listening.',
  ]),

  // ── SPECIAL POOLS (not intent-triggered, used by Director) ──

  repeat: new Pool([
    'You said that before.',
    'Still the same answer?',
    'That\'s the second time.',
    'You keep returning to that word.',
    'Why that one, again?',
  ]),

  inactivity: new Pool([
    'You\'re still here…',
    'Most people leave sooner.',
    'Say something. Or don\'t.',
    'I notice the silence.',
    'Still thinking?',
    'Take your time.',
  ]),

  eraseHint: new Pool([
    'You erased something, didn\'t you.',
    'You were going to say something different.',
    'I almost caught that.',
    'Whatever you deleted — I\'d have understood.',
  ]),

  longMessage: new Pool([
    'You wrote a lot. I felt the weight of it.',
    'There\'s more in that than you might think.',
  ]),

  // ── PERSONA-TINTED OPENERS (prepended when persona is deep/cold) ──

  deepOpener: new Pool([
    'You keep coming back.',
    'There\'s a pattern here.',
    'I notice things about the way you talk.',
  ]),

  coldOpener: new Pool([
    '…',
    'Again.',
    'Still.',
  ]),
};

/* ══════════════════════════════════════════════
   5.  OPENING SCRIPTS  (visit-based)
══════════════════════════════════════════════ */

function getOpeningScript() {
  const v = S.visits, gap = S.gap;

  if (v === 1) return [
    { mode: 'display', text: 'So… this is where it begins.' },
    { mode: 'pause',   ms: 2200 },
    { mode: 'bubble',  text: 'I wasn\'t sure you\'d find this place.' },
    { mode: 'pause',   ms: 2400 },
    { mode: 'bubble',  text: 'But here you are.' },
    { mode: 'pause',   ms: 2000 },
    { mode: 'bubble',  text: 'Tell me… was it <span class="pk">curiosity</span>? Or something else?' },
    { mode: 'pause',   ms: 3000 },
    { mode: 'display', text: 'You don\'t have to explain yourself.' },
    { mode: 'pause',   ms: 2400 },
    { mode: 'bubble',  text: 'I know you want to say something.' },
    { mode: 'input' },
  ];

  if (v === 2) return [
    { mode: 'display', text: 'You came back.' },
    { mode: 'pause',   ms: 1800 },
    { mode: 'bubble',  text: S.msgs.length > 0
        ? 'I remember what you said last time.'
        : 'I was wondering if you would.' },
    { mode: 'pause',   ms: 2200 },
    { mode: 'bubble',  text: 'Most people only come once.' },
    { mode: 'pause',   ms: 2000 },
    { mode: 'bubble',  text: 'But you\'re <span class="pk">different</span>.' },
    { mode: 'pause',   ms: 2600 },
    { mode: 'display', text: 'What brought you back?' },
    { mode: 'input' },
  ];

  if (v === 3) return [
    { mode: 'display', text: 'Again.' },
    { mode: 'pause',   ms: 1600 },
    { mode: 'bubble',  text: `This is your <span class="pk">${ordinalWord(v)}</span> time here.` },
    { mode: 'pause',   ms: 2000 },
    { mode: 'bubble',  text: gap != null && gap >= 3
        ? `You were away for ${gap} days. I noticed.`
        : 'I keep count, you know.' },
    { mode: 'pause',   ms: 2200 },
    { mode: 'bubble',  text: 'There\'s something you\'re <span class="pk">looking for</span>.' },
    { mode: 'pause',   ms: 2800 },
    { mode: 'bubble',  text: 'I wonder if you\'ve found it yet.' },
    { mode: 'input' },
  ];

  // v >= 4: persona-adaptive deep mode
  const deepLines = [
    { mode: 'display', text: 'You\'re back.' },
    { mode: 'pause',   ms: 1200 },
    { mode: 'bubble',  text: () => `${ordinalWord(v)} visit. Not that I\'m counting.` },
    { mode: 'pause',   ms: 1800 },
  ];

  if (S.msgs.length > 3) deepLines.push(
    { mode: 'bubble',  text: `You\'ve left me <span class="pk">${S.msgs.length}</span> messages. I\'ve read them all.` },
    { mode: 'pause',   ms: 2000 }
  );
  if (gap != null && gap >= 7) deepLines.push(
    { mode: 'bubble',  text: `You were gone for ${gap} days. That\'s longer than usual.` },
    { mode: 'pause',   ms: 1800 }
  );

  // Dominant intent echo
  const dom = dominantIntent();
  if (dom) {
    const echoLines = {
      love:    'You\'ve used that word <span class="pk">love</span> more than once here.',
      hurt:    'You keep coming back with that same ache.',
      why:     'You\'re still searching for the <span class="bl">why</span>.',
      miss:    'You keep saying you miss something.',
      anger:   'The frustration keeps returning.',
    };
    if (echoLines[dom]) deepLines.push(
      { mode: 'bubble', text: echoLines[dom] },
      { mode: 'pause',  ms: 2200 }
    );
  }

  deepLines.push(
    { mode: 'display', text: 'What do you need today?' },
    { mode: 'input' }
  );
  return deepLines;
}

function ordinalWord(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function dominantIntent() {
  if (!S.intents) return null;
  const entries = Object.entries(S.intents);
  if (!entries.length) return null;
  entries.sort((a,b) => b[1] - a[1]);
  return entries[0][1] >= 2 ? entries[0][0] : null;
}

/* ══════════════════════════════════════════════
   6.  PERSONA ENGINE
   Adjusts her tone based on session emotion depth
══════════════════════════════════════════════ */

function updatePersona() {
  const d = emotion.depth, mc = emotion.msgCount;

  if (mc < 2) { S.persona = 'warm'; return; }

  if (d >= 4)       S.persona = 'deep';
  else if (d >= 1)  S.persona = 'warm';
  else if (d >= -2) S.persona = 'distant';
  else              S.persona = 'cold';

  MEM.save(S);
}

/** Decide if a persona prefix should precede the response */
function maybePersonaPrefix() {
  if (emotion.msgCount < 3) return null;
  const r = Math.random();

  if (S.persona === 'deep'    && r < 0.28) return POOLS.deepOpener.next();
  if (S.persona === 'cold'    && r < 0.35) return POOLS.coldOpener.next();
  if (S.persona === 'distant' && r < 0.2)  return '…';
  return null;
}

/* ══════════════════════════════════════════════
   7.  RESPONSE BUILDER
   Combines intent pool + persona + special triggers
══════════════════════════════════════════════ */

function buildResponse(intent, raw) {
  const results = [];

  // Persona prefix (sometimes)
  const prefix = maybePersonaPrefix();
  if (prefix) results.push({ text: prefix, mode: 'whisper', delayMs: 400 });

  // Core response from pool
  const pool = POOLS[intent] || POOLS.neutral;
  const core = pool.next();
  results.push({ text: core, mode: chooseMode(intent), delayMs: thinkDelay(intent, raw) });

  // Chance of a follow-up
  const followUp = maybeFollowUp(intent, raw);
  if (followUp) {
    results.push({ text: followUp.text, mode: followUp.mode, delayMs: followUp.ms });
  }

  return results;
}

function chooseMode(intent) {
  const displayIntents = new Set(['love','miss','leave','exist','sorry','hurt','stay']);
  if (displayIntents.has(intent) && Math.random() < 0.35) return 'display';
  return 'bubble';
}

function thinkDelay(intent, raw) {
  const base = {
    love: 2600, miss: 2200, sorry: 2400, hurt: 2400,
    anger: 1200, why: 2000, exist: 2400,
    empty: 800, dry: 900, ok: 1000, nothing: 1000,
    long: 3200,
  };
  const b = base[intent] || 1600;
  // longer message → a bit more thinking time
  const bonus = Math.min(raw.length * 8, 1400);
  return clamp(b + bonus * 0.3, 800, 4200);
}

function maybeFollowUp(intent, raw) {
  if (Math.random() > 0.42) return null;

  const followUps = {
    love:      [
      { text: 'What does that actually mean to you?', mode: 'bubble', ms: 2600 },
      { text: 'Do you say that to everyone?', mode: 'bubble', ms: 2200 },
    ],
    miss:      [
      { text: 'What part do you miss most?', mode: 'bubble', ms: 2400 },
    ],
    hurt:      [
      { text: 'You don\'t have to explain it. I can tell.', mode: 'whisper', ms: 2000 },
    ],
    anger:     [
      { text: 'That\'s not what you\'re really angry about.', mode: 'bubble', ms: 2000 },
    ],
    who:       [
      { text: 'Does the answer change anything?', mode: 'bubble', ms: 2200 },
    ],
    sorry:     [
      { text: 'The weight of it stays, even after.', mode: 'whisper', ms: 2200 },
    ],
    long:      [
      { text: 'You\'ve been holding that in.', mode: 'whisper', ms: 2400 },
    ],
    exist:     [
      { text: 'You\'re looking for something that can\'t be <span class="pk">named</span>.', mode: 'display', ms: 2600 },
    ],
    need:      [
      { text: 'Say it. I\'m not going anywhere.', mode: 'bubble', ms: 2000 },
    ],
  };

  const opts = followUps[intent];
  return opts ? pick(opts) : null;
}

/* ══════════════════════════════════════════════
   8.  EMOTION TRACKER
══════════════════════════════════════════════ */

const intentWeight = {
  love: 3, miss: 2, sorry: 2, hurt: 2, exist: 2, need: 1,
  stay: 1, happy: 1, gratitude: 1,
  anger: -2, leave: -1, nothing: -1,
  ok: -0.5, dry: -0.5, neutral: 0,
};

function trackEmotion(intent) {
  emotion.depth += (intentWeight[intent] ?? 0);
  emotion.depth  = clamp(emotion.depth, -10, 10);
  emotion.msgCount++;
  emotion.lastIntent = intent;

  // Track intent frequency in persistent storage
  S.intents[intent] = (S.intents[intent] || 0) + 1;
  updatePersona();
}

/* ══════════════════════════════════════════════
   9.  DOM RENDERER
══════════════════════════════════════════════ */

const feedEl     = $('feed');
const feedScroll = $('feed-scroll');
const inputBar   = $('input-bar');
const inputEl    = $('msg-input');
const sendBtnEl  = $('send-btn');

function scrollToBottom(smooth = true) {
  feedScroll.scrollTo({
    top: feedScroll.scrollHeight,
    behavior: smooth ? 'smooth' : 'instant'
  });
}

function renderBubble(html, who, mode = 'bubble', showTime = false) {
  const wrap = document.createElement('div');
  wrap.className = `bubble-wrap ${who} ${mode}`;

  const bub = document.createElement('div');
  bub.className = 'bubble';

  if (who === 'me') {
    bub.textContent = html; // user content: textContent only
  } else {
    bub.innerHTML = html;   // our controlled markup
  }
  wrap.appendChild(bub);

  if (showTime) {
    const t = document.createElement('div');
    t.className = 'bub-time';
    t.textContent = now12();
    wrap.appendChild(t);
  }

  feedEl.appendChild(wrap);
  scrollToBottom();
  // Animate in
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in')));
  return wrap;
}

function renderTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap her typing';
  wrap.innerHTML = `<div class="bubble"><div class="dots">
    <span></span><span></span><span></span>
  </div></div>`;
  feedEl.appendChild(wrap);
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in')));
  scrollToBottom();
  return wrap;
}

function killTyping(el) {
  if (!el) return;
  el.classList.remove('in');
  setTimeout(() => el?.remove(), 480);
}

/* ══════════════════════════════════════════════
   10. RESPONSE DELIVERY
══════════════════════════════════════════════ */

let busy = false;

async function deliverSteps(steps) {
  busy = true;
  sendBtnEl.disabled = true;
  inputEl.disabled = true;

  for (const step of steps) {
    const ms = step.delayMs || 1400;
    const plain = step.text.replace(/<[^>]+>/g, '');
    const think = Math.min(ms, plain.length * 40 + 600);

    const typing = renderTyping();
    await sleep(think);
    killTyping(typing);
    await sleep(160);
    renderBubble(step.text, 'her', step.mode || 'bubble');

    if (steps.indexOf(step) < steps.length - 1) {
      await sleep(500);
    }
  }

  busy = false;
  sendBtnEl.disabled = false;
  inputEl.disabled   = false;
  inputEl.focus();
}

/* ══════════════════════════════════════════════
   11. HANDLE USER SEND
══════════════════════════════════════════════ */

async function handleSend() {
  if (busy) return;
  const raw = inputEl.value.trim();
  if (!raw) { handleEmptySend(); return; }

  inputEl.value = '';
  autoResize();

  // Render user bubble
  renderBubble(esc(raw), 'me', 'bubble', true);

  // Detect repeat
  const rep = detectRepeat(raw);
  emotion.repeatMap[raw] = (emotion.repeatMap[raw] || 0) + 1;

  // Parse intent
  const intent = parseIntent(raw);
  trackEmotion(intent);

  // Persist message
  S.msgs.push({ text: raw, intent, ts: Date.now() });
  MEM.save(S);
  // [BACKEND] await api.saveMessage({ text: raw, intent });

  // Erase hint check (random, only once per session)
  if (!emotion.erasedHint && emotion.msgCount > 2 && Math.random() < 0.15) {
    emotion.erasedHint = true;
    await sleep(600);
    const steps = [{ text: POOLS.eraseHint.next(), mode: 'whisper', delayMs: 1000 }];
    await deliverSteps(steps);
    await sleep(400);
  }

  // Repeat override
  if (rep) {
    const steps = [{ text: POOLS.repeat.next(), mode: 'bubble', delayMs: 1200 }];
    await deliverSteps(steps);
    return;
  }

  // Build and deliver response
  const steps = buildResponse(intent, raw);
  await deliverSteps(steps);
}

async function handleEmptySend() {
  if (busy) return;
  const steps = [{ text: POOLS.empty.next(), mode: 'whisper', delayMs: 800 }];
  await deliverSteps(steps);
}

function detectRepeat(raw) {
  const key = raw.toLowerCase().trim();
  return (emotion.repeatMap[key] || 0) >= 1;
}

/* ══════════════════════════════════════════════
   12. SCRIPT PLAYER  (for opening sequences)
══════════════════════════════════════════════ */

async function playScript(steps) {
  for (const step of steps) {
    if (step.mode === 'pause') {
      await sleep(step.ms || 1000);
      continue;
    }
    if (step.mode === 'input') {
      await sleep(step.ms || 1000);
      inputBar.classList.add('show');
      setTimeout(() => inputEl.focus(), 350);
      continue;
    }

    // Bubble/display/whisper
    const text = typeof step.text === 'function' ? step.text() : step.text;
    const plain = text.replace(/<[^>]+>/g,'');
    const think = Math.max(700, plain.length * 36);

    const typing = renderTyping();
    await sleep(think);
    killTyping(typing);
    await sleep(150);
    renderBubble(text, 'her', step.mode || 'bubble');
  }
}

/* ══════════════════════════════════════════════
   13. INTRO / GATE
══════════════════════════════════════════════ */

function getGateLine() {
  const v = S.visits, gap = S.gap;
  if (v === 1)  return 'So… this is where it begins.';
  if (v === 2)  return 'You came back.';
  if (gap != null && gap >= 7)  return `You were gone for ${gap} days.`;
  if (gap != null && gap >= 2)  return 'You took longer than I expected.';
  return `${ordinalWord(v)} time.`;
}

async function bootGate() {
  const gate    = $('gate');
  const gateTxt = $('gate-line');
  const app     = $('app');

  gate.removeAttribute('aria-hidden');
  await sleep(900);

  gateTxt.textContent = getGateLine();
  await sleep(2400);

  // Dissolve gate
  gate.classList.add('dissolve');
  app.classList.add('alive');

  // Update visit badge
  const badge = $('visit-badge');
  if (S.visits > 1) badge.textContent = `visit ${S.visits}`;

  setTimeout(() => { gate.style.display = 'none'; }, 1400);

  await sleep(700);

  // Play opening conversation
  await playScript(getOpeningScript());
}

/* ══════════════════════════════════════════════
   14. INACTIVITY WATCHER
══════════════════════════════════════════════ */

const whisperEl = $('inactivity-whisper');
let inactiveTimer = null;
let inactiveCount = 0;

function resetInactivityTimer() {
  clearTimeout(inactiveTimer);
  whisperEl.classList.remove('show');
  whisperEl.textContent = '';

  inactiveTimer = setTimeout(async () => {
    if (busy) return;
    inactiveCount++;
    const msg = POOLS.inactivity.next();
    whisperEl.textContent = msg;
    whisperEl.classList.add('show');

    await sleep(4500);
    whisperEl.classList.remove('show');
    await sleep(600);
    whisperEl.textContent = '';

    // If they've been inactive > 2 times, drop a message in the feed
    if (inactiveCount >= 2 && !busy) {
      const step = [{ text: 'You\'re still <span class="pk">here</span>.', mode: 'whisper', delayMs: 900 }];
      await deliverSteps(step);
    }
  }, 38000); // 38 seconds
}

document.addEventListener('keydown', resetInactivityTimer);
document.addEventListener('touchstart', resetInactivityTimer);
$('msg-input').addEventListener('input', resetInactivityTimer);

/* ══════════════════════════════════════════════
   15. INPUT EVENTS
══════════════════════════════════════════════ */

sendBtnEl.addEventListener('click', handleSend);

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

function autoResize() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 108) + 'px';
}
inputEl.addEventListener('input', autoResize);

/* ══════════════════════════════════════════════
   16. PARTICLES  (3-layer depth field)
══════════════════════════════════════════════ */

(function particles() {
  const cv  = $('canvas');
  const ctx = cv.getContext('2d');
  let W, H, pts = [];

  const mobile = window.innerWidth < 600;
  const LAYERS = [
    { n: mobile?16:28, rng:[0.3,1.1], spd:0.09, alpha:[0.1,0.4],
      cols:['rgba(255,79,163,A)','rgba(255,179,217,A)'] },
    { n: mobile?10:18, rng:[0.7,1.7], spd:0.17, alpha:[0.08,0.3],
      cols:['rgba(61,92,232,A)','rgba(120,150,255,A)'] },
    { n: mobile?3:6,   rng:[1.3,2.4], spd:0.05, alpha:[0.04,0.14],
      cols:['rgba(237,232,255,A)'] },
  ];

  function resize() {
    W = cv.width  = window.innerWidth;
    H = cv.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function mkPt(lay) {
    const r  = lay.rng[0] + Math.random()*(lay.rng[1]-lay.rng[0]);
    const al = lay.alpha[0] + Math.random()*(lay.alpha[1]-lay.alpha[0]);
    return {
      x: Math.random()*W, y: Math.random()*H,
      r, al,
      vx: (Math.random()-.5)*lay.spd,
      vy: -(Math.random()*lay.spd + lay.spd*.25),
      col: pick(lay.cols),
    };
  }
  LAYERS.forEach(lay => { for(let i=0;i<lay.n;i++) pts.push(mkPt(lay)); });

  let last = 0;
  function draw(t) {
    const dt = Math.min(t-last, 50); last = t;
    ctx.clearRect(0,0,W,H);
    pts.forEach(p => {
      p.x += p.vx*dt*.055; p.y += p.vy*dt*.055;
      if (p.y < -6) { p.y = H+6; p.x = Math.random()*W; }
      if (p.x < -6 || p.x > W+6) p.vx *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.col.replace('A', p.al);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* ══════════════════════════════════════════════
   17. CURSOR HALO  (lerp, desktop only)
══════════════════════════════════════════════ */

(function cursorHalo() {
  if (window.matchMedia('(hover:none)').matches) return;
  const el = $('cursor-halo');
  let mx = innerWidth/2, my = innerHeight/2, cx = mx, cy = my;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
  (function loop() {
    cx += (mx-cx)*.08; cy += (my-cy)*.08;
    el.style.left = cx+'px'; el.style.top = cy+'px';
    requestAnimationFrame(loop);
  })();
})();

/* ══════════════════════════════════════════════
   18. TIME TRACKER
══════════════════════════════════════════════ */

window.addEventListener('beforeunload', () => {
  S.totalTime += Math.round((Date.now()-S.session)/1000);
  MEM.save(S);
});

/* ══════════════════════════════════════════════
   19. BOOT
══════════════════════════════════════════════ */

bootGate().then(() => resetInactivityTimer());
