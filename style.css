/* ═══════════════════════════════════════════════════
   JUST FOR YOU — style.css
   Palette: Petal white #fff8fa · Rose pink #e8748a
            Blush #ffb8c6 · Warm cream #fff0f5
            Deep rose #c94f6a · Soft text #5c3d4a
═══════════════════════════════════════════════════ */

:root {
  --petal:      #fff8fa;
  --cream:      #fff0f5;
  --blush:      #ffb8c6;
  --rose:       #e8748a;
  --deep-rose:  #c94f6a;
  --soft-pink:  #f7c5d0;
  --mauve:      #9b5d6e;
  --text:       #4a2d38;
  --text-soft:  #8a6070;
  --text-muted: rgba(74,45,56,0.4);
  --glass:      rgba(255,255,255,0.65);
  --glass-bdr:  rgba(232,116,138,0.2);
  --shadow:     rgba(200,80,110,0.12);

  --ff-serif: 'Playfair Display', Georgia, serif;
  --ff-sans:  'DM Sans', system-ui, sans-serif;

  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  --safe-bot: env(safe-area-inset-bottom, 0px);
  --safe-top: env(safe-area-inset-top, 0px);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }

body {
  background: var(--cream);
  color: var(--text);
  font-family: var(--ff-sans);
  font-weight: 300;
  position: relative;
}

/* ════════════════════════════
   ATMOSPHERE
════════════════════════════ */

#petal-canvas {
  position: fixed; inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.9;
}

.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  will-change: transform, opacity;
}
.blob-a {
  width: min(70vw,600px); height: min(70vw,600px);
  background: radial-gradient(circle, rgba(255,184,198,0.55) 0%, transparent 65%);
  top: -20%; right: -15%;
  animation: blobDrift 18s ease-in-out infinite alternate;
}
.blob-b {
  width: min(80vw,700px); height: min(80vw,700px);
  background: radial-gradient(circle, rgba(247,197,208,0.4) 0%, transparent 65%);
  bottom: -25%; left: -20%;
  animation: blobDrift2 22s ease-in-out infinite alternate;
}
.blob-c {
  width: min(50vw,400px); height: min(50vw,400px);
  background: radial-gradient(circle, rgba(255,240,245,0.6) 0%, transparent 70%);
  top: 40%; left: 30%;
  animation: blobDrift 28s ease-in-out infinite alternate-reverse;
}
@keyframes blobDrift  {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(-4%, 6%) scale(1.08); }
}
@keyframes blobDrift2 {
  from { transform: translate(0,0) scale(1); }
  to   { transform: translate(5%, -5%) scale(1.1); }
}

/* ════════════════════════════
   GATE / LANDING
════════════════════════════ */

#gate {
  position: fixed; inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
  background: linear-gradient(160deg, #fff8fa 0%, #fff0f5 50%, #fce8ef 100%);
  transition: opacity 1.2s var(--ease-out), transform 1.2s var(--ease-out);
}
#gate.exit {
  opacity: 0;
  transform: scale(1.04);
  pointer-events: none;
}

#gate-content {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  text-align: center;
  padding-top: var(--safe-top);
  animation: gateIn 1s var(--ease-out) 0.2s both;
}
@keyframes gateIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Pill badge */
.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--blush);
  background: rgba(255,255,255,0.7);
  font-family: var(--ff-sans);
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--mauve);
  backdrop-filter: blur(8px);
}

/* Gate headline */
#gate-headline {
  font-family: var(--ff-serif);
  font-size: clamp(2.2rem, 8vw, 3.4rem);
  font-weight: 500;
  color: var(--text);
  line-height: 1.18;
  letter-spacing: -0.01em;
  position: relative;
}
.pink-italic {
  font-style: italic;
  color: var(--rose);
  display: block;
}
.heart-emoji {
  font-style: normal;
  font-size: 0.6em;
  vertical-align: super;
}

/* Sparkles */
.sparkles {
  position: relative;
  width: 100%; height: 0;
  pointer-events: none;
}
.sp {
  position: absolute;
  color: var(--blush);
  font-size: 0.9rem;
  animation: spFloat 4s ease-in-out infinite alternate;
  opacity: 0.7;
}
.sp1 { top: -80px; left:  8%; animation-delay: 0s;    font-size: 0.7rem; }
.sp2 { top: -50px; left: 80%; animation-delay: 0.6s;  font-size: 1rem;   }
.sp3 { top: -90px; left: 50%; animation-delay: 1.1s;  font-size: 0.8rem; color: var(--rose); }
.sp4 { top: -30px; left: 20%; animation-delay: 0.3s;  font-size: 0.6rem; }
.sp5 { top: -60px; left: 65%; animation-delay: 0.9s;  font-size: 0.75rem;}
@keyframes spFloat {
  from { transform: translateY(0) rotate(0deg);  opacity: 0.5; }
  to   { transform: translateY(-8px) rotate(20deg); opacity: 1; }
}

/* Sub-copy */
.gate-sub {
  font-family: var(--ff-serif);
  font-size: clamp(0.95rem, 2.8vw, 1.1rem);
  color: var(--text-soft);
  line-height: 1.6;
}
.italic-serif { font-style: italic; }

/* Meta */
.gate-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.02em;
  line-height: 1.5;
}

.soft-divider {
  width: 40px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--blush), transparent);
  margin: 0.2rem 0;
}

.gate-whisper {
  font-family: var(--ff-serif);
  font-size: 0.92rem;
  color: var(--rose);
  font-style: italic;
}

/* Ready button */
.ready-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.95rem 2.4rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, var(--rose) 0%, #d45f7a 50%, var(--deep-rose) 100%);
  color: #fff;
  font-family: var(--ff-serif);
  font-size: 1.05rem;
  font-style: italic;
  font-weight: 400;
  cursor: pointer;
  letter-spacing: 0.03em;
  box-shadow: 0 6px 28px rgba(200,80,110,0.35), 0 2px 8px rgba(200,80,110,0.2);
  transition: transform 0.22s var(--ease-spring), box-shadow 0.25s ease;
  margin-top: 0.3rem;
}
.ready-btn:hover  { transform: scale(1.04); box-shadow: 0 10px 36px rgba(200,80,110,0.45); }
.ready-btn:active { transform: scale(0.97); }
.btn-arrow { font-style: normal; transition: transform 0.2s ease; }
.ready-btn:hover .btn-arrow { transform: translateX(3px); }

/* Gate footer */
.gate-footer {
  display: flex;
  gap: 1.5rem;
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-top: 0.4rem;
}

/* ════════════════════════════
   MAIN APP
════════════════════════════ */

#app {
  position: fixed; inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  max-width: 540px;
  margin: 0 auto;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.9s var(--ease-out);
}
#app.alive { opacity: 1; pointer-events: auto; }

/* Top bar */
#top-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: calc(max(0.9rem, var(--safe-top))) 1.2rem 0.75rem;
  background: linear-gradient(to bottom, rgba(255,240,245,0.98) 0%, rgba(255,240,245,0) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  flex-shrink: 0;
}

#her-avatar {
  position: relative;
  width: 42px; height: 42px;
  flex-shrink: 0;
}
.avatar-ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--blush);
  animation: avatarPulse 3s ease-in-out infinite;
}
.avatar-core {
  width: 36px; height: 36px;
  margin: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fce8ef, #ffb8c6);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
}
@keyframes avatarPulse {
  0%,100% { transform: scale(1);    opacity: 0.7; }
  50%      { transform: scale(1.08); opacity: 1; }
}

#her-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
#her-name {
  font-family: var(--ff-serif);
  font-size: 1rem;
  font-style: italic;
  font-weight: 500;
  color: var(--text);
}
#her-status {
  font-size: 0.65rem;
  color: var(--rose);
  letter-spacing: 0.05em;
}

#visit-chip {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

/* Feed */
#feed-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem 1.1rem 0.5rem;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 8%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 8%);
}
#feed-wrap::-webkit-scrollbar { display: none; }

#feed {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding-bottom: 0.5rem;
}

/* ════════════════════════════
   BUBBLES
════════════════════════════ */

.bwrap {
  display: flex;
  flex-direction: column;
  max-width: 84%;
  opacity: 0;
  transform: translateY(12px) scale(0.98);
  transition: opacity 0.45s var(--ease-out), transform 0.45s var(--ease-out);
}
.bwrap.in { opacity: 1; transform: translateY(0) scale(1); }

.bwrap.her { align-self: flex-start; }
.bwrap.me  { align-self: flex-end; }

.bubble {
  padding: 0.82rem 1.1rem;
  border-radius: 1.2rem;
  font-size: clamp(0.88rem, 2.4vw, 0.97rem);
  line-height: 1.7;
  letter-spacing: 0.01em;
  position: relative;
  word-break: break-word;
}

/* HER — warm glass */
.bwrap.her .bubble {
  border-radius: 0.3rem 1.2rem 1.2rem 1.2rem;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(232,116,138,0.18);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--text);
  box-shadow: 0 2px 16px rgba(200,80,110,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
}

/* HER — display mode (large italic serif) */
.bwrap.her.display .bubble {
  background: transparent;
  border: none;
  backdrop-filter: none;
  box-shadow: none;
  padding: 0.2rem 0;
  font-family: var(--ff-serif);
  font-size: clamp(1.4rem, 4.5vw, 1.85rem);
  font-style: italic;
  font-weight: 400;
  color: var(--text);
  line-height: 1.3;
}

/* HER — whisper mode */
.bwrap.her.whisper .bubble {
  background: transparent;
  border: none;
  backdrop-filter: none;
  box-shadow: none;
  padding: 0.1rem 0;
  font-family: var(--ff-serif);
  font-size: 0.9rem;
  font-style: italic;
  color: var(--text-muted);
}

/* ME — rose gradient */
.bwrap.me .bubble {
  border-radius: 1.2rem 0.3rem 1.2rem 1.2rem;
  background: linear-gradient(135deg, rgba(232,116,138,0.85), rgba(201,79,106,0.9));
  color: #fff;
  box-shadow: 0 3px 18px rgba(200,80,110,0.25);
  font-weight: 300;
}

/* Accent */
.pk  { color: var(--rose); }
.pki { color: var(--rose); font-style: italic; }
.soft { color: var(--text-soft); font-style: italic; }

/* Timestamp */
.btime {
  font-size: 0.58rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.bwrap:hover .btime { opacity: 1; }
.bwrap.me .btime { text-align: right; opacity: 0.7; }

/* Typing dots */
.bwrap.typing .bubble { padding: 0.9rem 1.1rem; }
.dots { display: flex; gap: 5px; align-items: center; }
.dots span {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--rose); opacity: 0.35;
  animation: dotUp 1.3s ease-in-out infinite;
}
.dots span:nth-child(2) { animation-delay: 0.18s; }
.dots span:nth-child(3) { animation-delay: 0.36s; }
@keyframes dotUp {
  0%,80%,100% { transform: translateY(0); opacity: 0.3; }
  40%          { transform: translateY(-5px); opacity: 1; }
}

/* ════════════════════════════
   INPUT AREA
════════════════════════════ */

#input-area {
  flex-shrink: 0;
  padding: 0.7rem 1rem calc(0.75rem + var(--safe-bot));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.38rem;
  background: linear-gradient(to top,
    rgba(255,240,245,0.98) 0%,
    rgba(255,240,245,0.85) 70%,
    transparent 100%
  );
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

#input-box {
  width: 100%;
  max-width: 500px;
  display: flex;
  align-items: flex-end;
  gap: 0.55rem;
  background: rgba(255,255,255,0.82);
  border: 1.5px solid rgba(232,116,138,0.25);
  border-radius: 1.5rem;
  padding: 0.6rem 0.6rem 0.6rem 1.1rem;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(200,80,110,0.08);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
#input-box:focus-within {
  border-color: rgba(232,116,138,0.55);
  box-shadow: 0 0 0 3px rgba(232,116,138,0.08), 0 4px 24px rgba(200,80,110,0.12);
}

#msg-input {
  flex: 1;
  background: transparent;
  border: none; outline: none;
  color: var(--text);
  font-family: var(--ff-sans);
  font-size: 0.93rem;
  font-weight: 300;
  line-height: 1.5;
  resize: none;
  max-height: 100px;
  overflow-y: auto;
  scrollbar-width: none;
  caret-color: var(--rose);
}
#msg-input::placeholder { color: var(--text-muted); font-style: italic; }
#msg-input::-webkit-scrollbar { display: none; }

#send-btn {
  flex-shrink: 0;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--rose), var(--deep-rose));
  color: #fff;
  box-shadow: 0 3px 14px rgba(200,80,110,0.4);
  transition: transform 0.2s var(--ease-spring), box-shadow 0.2s ease, opacity 0.2s ease;
}
#send-btn svg { width: 15px; height: 15px; }
#send-btn:hover  { transform: scale(1.1); box-shadow: 0 5px 22px rgba(200,80,110,0.5); }
#send-btn:active { transform: scale(0.92); }
#send-btn:disabled { opacity: 0.4; cursor: default; transform: none; }

#input-hint {
  font-family: var(--ff-serif);
  font-size: 0.7rem;
  font-style: italic;
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

/* ════════════════════════════
   UTILITY
════════════════════════════ */
@keyframes fadeUp {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}

@media (max-width: 480px) {
  .bwrap.her.display .bubble { font-size: clamp(1.2rem, 5.5vw, 1.5rem); }
  #feed-wrap { padding: 0.5rem 0.85rem 0.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
