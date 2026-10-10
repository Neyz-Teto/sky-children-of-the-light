import Lenis from 'lenis';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const pageName = document.body.dataset.page || '';
const mediaBase = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
let lenis;
let lenisFrame = 0;
let atmosphereFrame = 0;
let heroPlayer;
let heroVisible = true;
let pointerX = -100;
let pointerY = -100;
let lastHoverSoundAt = 0;
let galleryItems = [];
let galleryIndex = 0;

class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = localStorage.getItem('skySound') === 'on';
    this.ambientAllowed = sessionStorage.getItem('skyAmbient') === 'on';
    this.ambientNodes = [];
    this.master = null;
    this.lastHoverAt = 0;
  }

  unlock(enableAmbient = false) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!this.context) {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.13;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    if (enableAmbient) {
      this.enabled = true;
      this.ambientAllowed = true;
      localStorage.setItem('skySound', 'on');
      sessionStorage.setItem('skyAmbient', 'on');
      this.startAmbient();
    }
  }

  setEnabled(value, fromGesture = false) {
    this.enabled = value;
    localStorage.setItem('skySound', value ? 'on' : 'off');
    if (value && fromGesture) this.unlock();
    if (!value) this.fadeAmbient(0);
    else if (this.ambientAllowed && fromGesture && !reducedMotion) this.startAmbient();
  }

  tone(frequency = 523.25, duration = 0.18, volume = 0.32, shape = 'sine') {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.76), now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(volume, now + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  click() {
    const notes = [392, 440, 523.25, 587.33, 659.25];
    this.tone(notes[Math.floor(Math.random() * notes.length)], 0.17, 0.22);
  }

  hover() {
    const now = performance.now();
    if (now - this.lastHoverAt < 120) return;
    this.lastHoverAt = now;
    this.tone(740 + Math.random() * 90, 0.08, 0.09, 'triangle');
  }

  transition() {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.45, this.context.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
    const noise = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    noise.buffer = noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.34);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
    noise.stop(now + 0.46);
    window.setTimeout(() => this.tone(587.33, 0.24, 0.18), 150);
  }

  startAmbient() {
    if (reducedMotion || !this.enabled || !this.ambientAllowed || !this.context || this.ambientNodes.length) return;
    const now = this.context.currentTime;
    const bus = this.context.createGain();
    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.linearRampToValueAtTime(0.024, now + 3.5);
    bus.connect(this.master);
    this.ambientNodes.push(bus);
    [130.81, 196, 261.63].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const voice = this.context.createGain();
      oscillator.type = index === 1 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      voice.gain.value = index === 0 ? 0.42 : 0.22;
      oscillator.connect(voice);
      voice.connect(bus);
      oscillator.start();
      this.ambientNodes.push(oscillator, voice);
    });
  }

  fadeAmbient(target = 0) {
    if (!this.context || !this.ambientNodes.length) return;
    const bus = this.ambientNodes[0];
    if (bus?.gain) {
      bus.gain.cancelScheduledValues(this.context.currentTime);
      bus.gain.setTargetAtTime(target, this.context.currentTime, 0.9);
    }
    if (target === 0) {
      const nodes = this.ambientNodes;
      this.ambientNodes = [];
      window.setTimeout(() => nodes.slice(1).forEach((node) => {
        try { node.stop?.(); node.disconnect?.(); } catch {}
      }), 4500);
    }
  }
}

const audio = window.__skyAudio || new AudioManager();
window.__skyAudio = audio;

function setupScroll() {
  if (!reducedMotion) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1, syncTouch: false });
    const tick = (time) => {
      lenis?.raf(time);
      lenisFrame = window.requestAnimationFrame(tick);
    };
    lenisFrame = window.requestAnimationFrame(tick);
  }
  const progress = document.querySelector('[data-scroll-progress]');
  let lastY = window.scrollY;
  const header = document.querySelector('[data-header]');
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
    if (header) {
      const currentY = window.scrollY;
      header.classList.toggle('is-scrolled', currentY > 18);
      if (!document.querySelector('[data-mobile-menu].is-open') && currentY > 130 && currentY > lastY + 3) header.classList.add('is-hidden');
      else if (currentY < lastY - 3 || currentY < 50) header.classList.remove('is-hidden');
      lastY = currentY;
    }
    if (!reducedMotion) {
      document.querySelectorAll('.media-frame[data-parallax]').forEach((frame) => {
        const box = frame.getBoundingClientRect();
        const offset = Math.max(-12, Math.min(12, (window.innerHeight / 2 - (box.top + box.height / 2)) * .025));
        frame.style.setProperty('--parallax-y', `${offset}px`);
      });
    }
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function setupReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reducedMotion) {
    targets.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -45px 0px' });
  targets.forEach((element) => observer.observe(element));
}

function setupNavigation() {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  const header = document.querySelector('[data-header]');
  const closeMenu = () => {
    if (!menu || !menuToggle) return;
    menu.classList.remove('is-open');
    menu.inert = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Buka menu');
    header?.classList.remove('menu-open');
    document.body.classList.remove('menu-is-open');
  };
  menuToggle?.addEventListener('click', () => {
    if (!menu) return;
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    header?.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-is-open', open);
    if (open) menu.querySelector('a')?.focus();
  });
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeMenu(); menuToggle?.focus(); }
    if (event.key === 'Tab' && menu?.classList.contains('is-open')) {
      const focusable = [...menu.querySelectorAll('a[href]'), menuToggle].filter(Boolean);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const enter = document.body.classList.contains('page-enter');
  if (!enter) document.body.classList.add('page-enter');
  window.setTimeout(() => document.body.classList.remove('page-enter'), 760);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-transition], .desktop-nav a, .mobile-nav a, .wordmark');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin || target.pathname === location.pathname && !target.hash) return;
    if (target.hash && target.pathname === location.pathname) return;
    event.preventDefault();
    const wash = document.querySelector('[data-page-wash]');
    if (wash) {
      const box = link.getBoundingClientRect();
      wash.style.setProperty('--wash-x', `${box.left + box.width / 2}px`);
      wash.style.setProperty('--wash-y', `${box.top + box.height / 2}px`);
    }
    document.body.classList.add('is-transitioning');
    audio.transition();
    window.setTimeout(() => { window.location.assign(target.href); }, reducedMotion ? 180 : 690);
  });
}

function setupIntro() {
  const intro = document.querySelector('[data-intro]');
  if (!intro || pageName !== 'home') return;
  const vintage = intro.querySelector('.vintage-overlay');
  if (sessionStorage.getItem('skyIntroSeen') === 'yes') {
    if (vintage) document.body.append(vintage);
    return;
  }
  const root = document.documentElement;
  const scrollY = window.scrollY;
  const background = [...document.body.children].filter((element) => element !== intro).map((element) => ({
    element,
    inert: element.inert,
    ariaHidden: element.getAttribute('aria-hidden'),
  }));
  background.forEach(({ element }) => { element.inert = true; element.setAttribute('aria-hidden', 'true'); });
  root.classList.add('intro-lock');
  intro.hidden = false;
  intro.inert = false;
  intro.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-intro');
  lenis?.stop();
  let finished = false;
  let videoPlaying = false;
  let posterOnly = false;
  let billowTimer = 0;
  const soundButton = intro.querySelector('[data-intro-sound]');
  const poster = intro.querySelector('[data-intro-poster]');
  const posterLoader = intro.querySelector('[data-intro-loader]');
  const onVideoPlaying = () => {
    videoPlaying = true;
    if (!posterOnly) intro.classList.add('has-video');
  };
  window.addEventListener('sky:hero-playing', onVideoPlaying);
  const videoTimer = window.setTimeout(() => {
    if (!videoPlaying) { posterOnly = true; intro.classList.add('poster-only'); }
  }, 4000);
  const loaderTimer = window.setTimeout(() => posterLoader?.classList.add('is-hidden'), 1200);
  const loadFallback = () => {
    if (!poster) return;
    const fallback = poster.dataset.fallback;
    if (fallback && poster.src !== new URL(fallback, location.href).href) {
      poster.dataset.fallback = '';
      poster.src = fallback;
    } else {
      poster.hidden = true;
      intro.classList.add('poster-missing');
    }
  };
  const verifyPoster = () => {
    if (!poster) return;
    if (poster.naturalWidth >= 300) intro.classList.add('poster-ready');
    else loadFallback();
  };
  poster?.addEventListener('load', verifyPoster);
  poster?.addEventListener('error', loadFallback);
  if (poster?.complete) verifyPoster();
  const finish = (withSound, skip = false) => {
    if (finished) return;
    finished = true;
    if (vintage) document.body.append(vintage);
    sessionStorage.setItem('skyIntroSeen', 'yes');
    if (withSound) {
      audio.unlock(true);
      audio.click();
      updateSoundToggle();
    } else {
      audio.setEnabled(false);
      sessionStorage.setItem('skyAmbient', 'off');
      updateSoundToggle();
    }
    if (skip) intro.classList.add('is-skipping');
    intro.classList.add('is-leaving');
    const duration = reducedMotion ? 260 : skip ? 300 : 1500;
    window.setTimeout(() => {
      window.clearTimeout(videoTimer);
      window.clearTimeout(loaderTimer);
      window.clearTimeout(billowTimer);
      window.removeEventListener('sky:hero-playing', onVideoPlaying);
      intro.remove();
      document.body.classList.remove('has-intro');
      root.classList.remove('intro-lock');
      background.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
      lenis?.start();
      if (window.scrollY !== scrollY) window.scrollTo(0, scrollY);
      document.body.classList.add('page-enter');
      window.setTimeout(() => document.body.classList.remove('page-enter'), 800);
    }, duration);
  };
  soundButton?.addEventListener('click', () => finish(true), { once: true });
  intro.querySelector('[data-intro-silent]')?.addEventListener('click', () => finish(false), { once: true });
  intro.querySelector('[data-intro-skip]')?.addEventListener('click', () => finish(false, true), { once: true });
  intro.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); finish(false, true); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...intro.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hidden);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  intro.addEventListener('pointerover', (event) => {
    if (event.pointerType !== 'touch' && event.target.closest('button')) intro.classList.add('is-hover-button');
    if (event.pointerType !== 'touch' && event.target.closest('[data-intro-sound]')) intro.classList.add('is-candle-raised');
  });
  intro.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget?.closest?.('button')) intro.classList.remove('is-hover-button');
    if (!event.relatedTarget?.closest?.('[data-intro-sound]')) intro.classList.remove('is-candle-raised');
  });
  intro.addEventListener('pointerdown', () => {
    intro.classList.add('is-billowing');
    window.clearTimeout(billowTimer);
    billowTimer = window.setTimeout(() => intro.classList.remove('is-billowing'), 760);
  }, { passive: true });
  if (!reducedMotion && !coarsePointer) {
    intro.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const x = (event.clientX / window.innerWidth - .5) * 2;
      const y = (event.clientY / window.innerHeight - .5) * 2;
      intro.style.setProperty('--parallax-x', `${x * 14}px`);
      intro.style.setProperty('--parallax-y', `${y * 9}px`);
      intro.style.setProperty('--traveler-lean', `${x * 4}deg`);
    }, { passive: true });
  }
  const pauseAtmosphere = () => {
    intro.classList.toggle('is-paused', document.hidden);
    document.documentElement.classList.toggle('is-page-hidden', document.hidden);
  };
  document.addEventListener('visibilitychange', pauseAtmosphere);
  soundButton?.focus({ preventScroll: true });
}

function updateSoundToggle() {
  const toggle = document.querySelector('[data-sound-toggle]');
  if (!toggle) return;
  toggle.setAttribute('aria-pressed', String(audio.enabled));
  toggle.setAttribute('aria-label', audio.enabled ? 'Matikan suara' : 'Nyalakan suara');
}

function setupSound() {
  const toggle = document.querySelector('[data-sound-toggle]');
  updateSoundToggle();
  toggle?.addEventListener('click', () => {
    const next = !audio.enabled;
    audio.setEnabled(next, true);
    if (next) audio.click();
    updateSoundToggle();
  });
  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch' || !event.target.closest('a, button, [role="button"]')) return;
    const now = performance.now();
    if (now - lastHoverSoundAt < 120) return;
    lastHoverSoundAt = now;
    audio.hover();
  }, { passive: true });
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') createRipple(event.clientX, event.clientY);
    if (event.target.closest('a, button, [role="button"]')) {
      if (audio.enabled) audio.unlock(audio.ambientAllowed && !reducedMotion);
      audio.click();
    }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.fadeAmbient(0);
    else if (audio.enabled && audio.ambientAllowed && !reducedMotion) audio.startAmbient();
  });
}

function createRipple(x, y) {
  const ripple = document.createElement('span');
  ripple.className = 'tap-ripple';
  ripple.style.left = `${x - 11}px`;
  ripple.style.top = `${y - 11}px`;
  document.body.append(ripple);
  window.setTimeout(() => ripple.remove(), 650);
}

function setupParticlesAndCursor() {
  const canvas = document.querySelector('[data-particles]');
  const cursor = document.querySelector('[data-cursor]');
  const dot = cursor?.querySelector('[data-cursor-dot]');
  const ring = cursor?.querySelector('[data-cursor-ring]');
  const cursorLabel = cursor?.querySelector('[data-cursor-label]');
  const trail = [];
  const maxParticles = coarsePointer ? 25 : 60;
  let particles = [];
  let activeCard = null;
  let activeMagnetic = null;
  let hidden = false;
  let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  let context;
  let width = 0;
  let height = 0;

  if (canvas && !reducedMotion) {
    context = canvas.getContext('2d', { alpha: true });
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: maxParticles }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + .35,
        alpha: Math.random() * .38 + .12,
        speed: Math.random() * .22 + .035,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
  }

  if (cursor && !coarsePointer && !reducedMotion) {
    for (let index = 0; index < 8; index += 1) {
      const mote = document.createElement('span');
      mote.className = 'cursor-mote';
      mote.setAttribute('aria-hidden', 'true');
      document.body.append(mote);
      trail.push({ element: mote, x: -100, y: -100, alpha: 0 });
    }
    document.body.classList.add('has-custom-cursor');
    document.addEventListener('pointerover', (event) => {
      activeCard = event.target.closest('[data-media-frame], .gallery-item__link');
      activeMagnetic = event.target.closest('[data-magnetic], .nav-link');
      if (activeMagnetic?.classList.contains('nav-link')) {
        const box = activeMagnetic.getBoundingClientRect();
        activeMagnetic.style.setProperty('--line-origin', pointerX > box.left + box.width / 2 ? 'right' : 'left');
      }
      if (activeCard) {
        const label = activeCard.getAttribute('data-youtube-id') ? 'Putar' : 'Lihat';
        if (cursorLabel) cursorLabel.textContent = label;
        cursor?.classList.add('is-hover');
      } else if (event.target.closest('a, button')) {
        if (cursorLabel) cursorLabel.textContent = '';
        cursor?.classList.add('is-hover');
      }
    }, { passive: true });
    document.addEventListener('pointerout', (event) => {
      if (!event.relatedTarget) cursor?.classList.add('is-hidden');
      if (event.target === document.documentElement || event.target === document.body) cursor?.classList.add('is-hidden');
      if (event.target.closest('[data-media-frame], .gallery-item__link, a, button')) {
        const next = event.relatedTarget?.closest?.('[data-media-frame], .gallery-item__link, a, button');
        if (!next) {
          cursor?.classList.remove('is-hover');
          activeCard = null;
          activeMagnetic = null;
        }
      }
    }, { passive: true });
    document.addEventListener('pointerenter', () => cursor?.classList.remove('is-hidden'));
  }

  const pointerMove = (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    hidden = false;
  };
  window.addEventListener('pointermove', pointerMove, { passive: true });
  window.addEventListener('pointerleave', () => { hidden = true; cursor?.classList.add('is-hidden'); }, { passive: true });

  let ringX = pointerX;
  let ringY = pointerY;
  const draw = () => {
    if (document.hidden) {
      atmosphereFrame = window.requestAnimationFrame(draw);
      return;
    }
    if (context && !reducedMotion) {
      context.clearRect(0, 0, width, height);
      const t = performance.now() * .001;
      particles.forEach((particle) => {
        const dx = pointerX - particle.x;
        const dy = pointerY - particle.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 90) {
          particle.x -= dx / Math.max(distance, 1) * (90 - distance) * .002;
          particle.y -= dy / Math.max(distance, 1) * (90 - distance) * .002;
        }
        particle.y -= particle.speed;
        particle.x += Math.sin(t + particle.phase) * .08;
        if (particle.y < -4) { particle.y = height + 4; particle.x = Math.random() * width; }
        const glow = distance < 105 && !coarsePointer ? .22 : 0;
        context.beginPath();
        context.fillStyle = `rgba(255, 246, 220, ${Math.min(.85, particle.alpha + glow)})`;
        context.shadowColor = 'rgba(242, 198, 109, .7)';
        context.shadowBlur = glow ? 9 : 3;
        context.arc(particle.x, particle.y, particle.radius + (glow ? .35 : 0), 0, Math.PI * 2);
        context.fill();
      });
      context.shadowBlur = 0;
    }
    if (cursor && dot && ring && !coarsePointer && !reducedMotion) {
      ringX += (pointerX - ringX) * .18;
      ringY += (pointerY - ringY) * .18;
      dot.style.transform = `translate(${pointerX}px, ${pointerY}px)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      if (cursorLabel) cursorLabel.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      trail.forEach((mote, index) => {
        const lag = (index + 1) / trail.length;
        mote.x += (pointerX - mote.x) * (0.13 - lag * .055);
        mote.y += (pointerY - mote.y) * (0.13 - lag * .055);
        mote.alpha += ((hidden ? 0 : 0.23 * (1 - lag)) - mote.alpha) * .12;
        mote.element.style.transform = `translate(${mote.x}px, ${mote.y}px) scale(${1 - lag * .6})`;
        mote.element.style.opacity = String(mote.alpha);
      });
      if (activeCard) {
        const box = activeCard.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (pointerX - box.left) / box.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (pointerY - box.top) / box.height * 2 - 1));
        activeCard.style.setProperty('--mx', `${((pointerX - box.left) / box.width) * 100}%`);
        activeCard.style.setProperty('--my', `${((pointerY - box.top) / box.height) * 100}%`);
        activeCard.style.setProperty('--tilt-x', `${-y * 3}deg`);
        activeCard.style.setProperty('--tilt-y', `${x * 3}deg`);
      }
      if (activeMagnetic) {
        const box = activeMagnetic.getBoundingClientRect();
        const dx = pointerX - (box.left + box.width / 2);
        const dy = pointerY - (box.top + box.height / 2);
        const distance = Math.hypot(dx, dy);
        const strength = distance < 80 ? (1 - distance / 80) * .1 : 0;
        activeMagnetic.style.translate = `${dx * strength}px ${dy * strength}px`;
      }
      if (!activeMagnetic) document.querySelectorAll('[data-magnetic], .nav-link').forEach((node) => { node.style.translate = ''; });
    }
    atmosphereFrame = window.requestAnimationFrame(draw);
  };
  atmosphereFrame = window.requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => { if (document.hidden) context?.clearRect(0, 0, width, height); });
}

function setupHero() {
  const localVideo = document.querySelector('[data-local-hero]');
  const hero = document.querySelector('[data-hero-youtube]');
  const soundButton = document.querySelector('[data-hero-sound]');
  if (localVideo) {
    const stage = localVideo.closest('[data-hero-local]');
    const play = () => { if (heroVisible && !document.hidden && !reducedMotion) localVideo.play().catch(() => {}); };
    localVideo.addEventListener('playing', () => {
      stage?.classList.add('is-playing');
      window.dispatchEvent(new Event('sky:hero-playing'));
    });
    localVideo.addEventListener('error', () => { localVideo.hidden = true; }, { once: true });
    play();
    observeHero(stage || localVideo);
    soundButton?.addEventListener('click', () => {
      localVideo.muted = !localVideo.muted;
      localVideo.play().catch(() => {});
      soundButton.setAttribute('aria-label', localVideo.muted ? 'Aktifkan suara video hero' : 'Matikan suara video hero');
      soundButton.querySelector('span').textContent = localVideo.muted ? 'Suara & video' : 'Matikan suara';
      if (!localVideo.muted) audio.fadeAmbient(0);
    });
  } else if (hero) {
    const videoId = hero.dataset.youtubeId;
    const videoStart = Number(hero.dataset.start || 0);
    const videoEnd = Number(hero.dataset.end || 0);
    const frame = hero.querySelector('[data-hero-frame]');
    const poster = hero.querySelector('.hero-media__poster');
    const loadApi = () => {
      if (window.YT?.Player) return Promise.resolve(window.YT);
      if (!window.__ytApiPromise) {
        window.__ytApiPromise = new Promise((resolve) => {
          const previousReady = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = () => {
            previousReady?.();
            resolve(window.YT);
          };
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          script.async = true;
          document.head.append(script);
        });
      }
      return window.__ytApiPromise;
    };
    loadApi().then((YT) => {
      if (!frame || !hero.isConnected) return;
      heroPlayer = new YT.Player(frame, {
        videoId,
        playerVars: { autoplay: reducedMotion ? 0 : 1, controls: 0, disablekb: 1, fs: 0, loop: 1, playlist: videoId, playsinline: 1, rel: 0, modestbranding: 1, start: videoStart, end: videoEnd, origin: location.origin },
        events: {
          onReady: (event) => {
            event.target.mute();
            event.target.setVolume(0);
            if (heroVisible && !document.hidden && !reducedMotion) event.target.playVideo();
            hero.classList.add('is-ready');
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              hero.classList.add('is-playing');
              if (poster) poster.style.opacity = '0';
              window.dispatchEvent(new Event('sky:hero-playing'));
              if (audio.enabled) audio.fadeAmbient(0);
            }
            if (event.data === YT.PlayerState.ENDED) heroPlayer?.seekTo(videoStart, true);
          },
          onError: () => window.dispatchEvent(new Event('sky:hero-error')),
        },
      });
    }).catch(() => {});
    observeHero(hero);
    soundButton?.addEventListener('click', () => {
      if (heroPlayer?.unMute) {
        heroPlayer.unMute();
        heroPlayer.setVolume(45);
        heroPlayer.playVideo();
        audio.fadeAmbient(0);
        soundButton.setAttribute('aria-label', 'Suara trailer aktif');
        soundButton.querySelector('span').textContent = 'Trailer aktif';
      } else {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
      }
    });
  }
  function observeHero(target) {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroPlayer) heroVisible && !document.hidden && !reducedMotion ? heroPlayer.playVideo() : heroPlayer.pauseVideo();
      if (localVideo) heroVisible && !document.hidden && !reducedMotion ? localVideo.play().catch(() => {}) : localVideo.pause();
    }, { threshold: 0.12 });
    observer.observe(target);
  }
  document.addEventListener('visibilitychange', () => {
    if (heroPlayer) heroVisible && !document.hidden && !reducedMotion ? heroPlayer.playVideo() : heroPlayer.pauseVideo();
    if (localVideo) heroVisible && !document.hidden && !reducedMotion ? localVideo.play().catch(() => {}) : localVideo.pause();
  });
}

function setupMedia() {
  document.querySelectorAll('[data-media-frame] img, .gallery-item__image img, .hero-media__poster').forEach((image) => {
    image.addEventListener('error', () => {
      const stage = Number(image.dataset.fallbackStage || 0);
      const fallback = stage === 0 ? image.dataset.fallback : image.dataset.hqFallback;
      if (fallback && image.src !== new URL(fallback, location.href).href) {
        image.dataset.fallbackStage = String(stage + 1);
        image.src = fallback;
      } else {
        image.hidden = true;
        image.alt = '';
        image.parentElement?.classList.add('has-placeholder');
      }
    });
  });
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-load-youtube]');
    if (!link) return;
    const frame = link.closest('[data-media-frame]');
    const id = frame?.dataset.youtubeId;
    if (!id) return;
    event.preventDefault();
    const imageBox = frame.querySelector('.media-frame__image');
    if (!imageBox || imageBox.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1&modestbranding=1&enablejsapi=1`;
    iframe.title = link.getAttribute('aria-label') || 'Video Sky resmi';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    imageBox.append(iframe);
    frame.classList.add('is-playing');
    audio.fadeAmbient(0);
  });
  const videos = [...document.querySelectorAll('video[data-local-media]')];
  if (videos.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting ? entry.target.play().catch(() => {}) : entry.target.pause()), { threshold: .1 });
    videos.forEach((video) => observer.observe(video));
  }
}

function setupRealmIndex() {
  const index = document.querySelector('.realm-index');
  if (!index) return;
  const links = [...index.querySelectorAll('a')];
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window)) return;
  let activeScene = '';
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const activeId = `#${entry.target.id}`;
      links.forEach((link) => {
        const active = link.getAttribute('href') === activeId;
        link.classList.toggle('is-active', active);
        if (active) audio.tone(659.25, .2, .1, 'triangle');
      });
      if (activeScene === activeId) return;
      activeScene = activeId;
    });
  }, { threshold: .45 });
  sections.forEach((section) => observer.observe(section));
  links.forEach((link) => link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
  }));
}

function setupGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;
  const filterButtons = [...document.querySelectorAll('[data-gallery-filter]')];
  const cards = [...grid.querySelectorAll('[data-gallery-item]')];
  const count = document.querySelector('[data-gallery-count]');
  const dialog = document.querySelector('[data-lightbox]');
  const body = dialog?.querySelector('[data-lightbox-body]');
  const caption = dialog?.querySelector('[data-lightbox-caption]');
  galleryItems = cards;

  const visibleCards = () => cards.filter((card) => !card.hidden);
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.galleryFilter;
    filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach((card) => { card.hidden = filter !== 'all' && card.dataset.filter !== filter; });
    if (count) count.textContent = String(visibleCards().length);
  }));

  const renderLightbox = (index) => {
    const visible = visibleCards();
    if (!visible.length) return;
    galleryIndex = (index + visible.length) % visible.length;
    const item = visible[galleryIndex];
    const sourceLink = item.querySelector('[data-gallery-open]');
    const img = item.querySelector('img');
    if (!body || !caption) return;
    body.replaceChildren();
    if (item.dataset.youtubeId) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.dataset.youtubeId)}?autoplay=1&rel=0&playsinline=1&modestbranding=1&enablejsapi=1`;
      iframe.title = item.dataset.galleryCaption || 'Video Sky resmi';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      body.append(iframe);
      const open = document.createElement('a');
      open.className = 'lightbox__source';
      open.href = sourceLink?.href || item.dataset.watchUrl;
      open.target = '_blank';
      open.rel = 'noopener noreferrer';
      open.textContent = 'Buka di YouTube ↗';
      body.append(open);
    } else if (img) {
      const preview = document.createElement('img');
      preview.src = img.currentSrc || img.src;
      preview.alt = img.alt;
      preview.width = 1280;
      preview.height = 720;
      body.append(preview);
    }
    caption.textContent = item.dataset.galleryCaption || img?.alt || 'Media Sky';
    audio.fadeAmbient(0);
  };
  const openAt = (card) => {
    const index = visibleCards().indexOf(card);
    if (index < 0 || !dialog) return;
    renderLightbox(index);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-lightbox-close]')?.focus();
  };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-gallery-open]');
    if (!link) return;
    const card = link.closest('[data-gallery-item]');
    if (!card) return;
    event.preventDefault();
    openAt(card);
  });
  dialog?.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
  dialog?.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => renderLightbox(galleryIndex - 1));
  dialog?.querySelector('[data-lightbox-next]')?.addEventListener('click', () => renderLightbox(galleryIndex + 1));
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); renderLightbox(galleryIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); renderLightbox(galleryIndex + 1); }
    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button, a[href]')].filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  let touchStartX = 0;
  dialog?.addEventListener('pointerdown', (event) => { if (event.pointerType === 'touch') touchStartX = event.clientX; }, { passive: true });
  dialog?.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch') return;
    const distance = event.clientX - touchStartX;
    if (Math.abs(distance) < 65) return;
    renderLightbox(galleryIndex + (distance < 0 ? 1 : -1));
  }, { passive: true });
}

function teardown() {
  if (lenisFrame) window.cancelAnimationFrame(lenisFrame);
  if (atmosphereFrame) window.cancelAnimationFrame(atmosphereFrame);
  lenis?.destroy();
  lenis = undefined;
}

document.addEventListener('DOMContentLoaded', () => {
  setupScroll();
  setupReveal();
  setupNavigation();
  setupIntro();
  setupSound();
  setupParticlesAndCursor();
  setupHero();
  setupMedia();
  setupRealmIndex();
  setupGallery();
});
window.addEventListener('pagehide', teardown, { once: true });
