/* ==========================================================================
   ODH CONSTRUCCIONES | interacción y animación
   GSAP + ScrollTrigger + Lenis. Si alguna librería no carga, el sitio sigue
   funcionando sin animaciones.
   ========================================================================== */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));

  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const animate = hasGSAP && !reduce;
  const PHONE = '529621666535';
  const pad = (n, l = 2) => String(n).padStart(l, '0');

  window.__odh = true;
  if (!animate) root.classList.remove('js-anim');

  let lenis = null;

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */
  function splitText(el, masked) {
    const out = [];
    (function walk(node) {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            if (masked) {
              const w = d.createElement('span');
              const i = d.createElement('span');
              w.className = 'w'; i.className = 'wi'; i.textContent = part;
              w.appendChild(i); frag.appendChild(w); out.push(i);
            } else {
              const s = d.createElement('span');
              s.className = 'wd'; s.textContent = part;
              frag.appendChild(s); out.push(s);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w') && !n.classList.contains('wd')) {
          walk(n);
        }
      });
    })(el);
    el.classList.add('is-split');
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Núcleo (funciona sin GSAP)                                          */
  /* ------------------------------------------------------------------ */
  function initMenu() {
    const ham = $('#ham');
    const mob = $('#mob');
    if (!ham || !mob) return;
    const setOpen = (open) => {
      mob.classList.toggle('is-open', open);
      d.body.classList.toggle('menu-open', open);
      ham.setAttribute('aria-expanded', String(open));
      ham.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (lenis) open ? lenis.stop() : lenis.start();
      else d.body.style.overflow = open ? 'hidden' : '';
    };
    ham.addEventListener('click', () => setOpen(!mob.classList.contains('is-open')));
    $$('a', mob).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    addEventListener('resize', () => { if (innerWidth >= 1024) setOpen(false); });
  }

  function initAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { duration: 1.7, easing: (t) => 1 - Math.pow(1 - t, 4) });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function initNavFallback() {
    const nav = $('#nav');
    const sentinel = d.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:60px;pointer-events:none';
    d.body.prepend(sentinel);
    new IntersectionObserver((es) => nav.classList.toggle('is-scrolled', !es[0].isIntersecting)).observe(sentinel);
  }

  function initAccordion() {
    const acc = $('#acc');
    if (!acc) return;
    const items = $$('.acc-item', acc);
    let idx = 0, paused = false, inView = false, resume = null;
    const set = (i) => { idx = i; items.forEach((it, k) => it.classList.toggle('is-active', k === i)); };
    const hold = (ms) => { paused = true; clearTimeout(resume); resume = setTimeout(() => { paused = false; }, ms); };
    items.forEach((it, i) => {
      if (finePointer) it.addEventListener('mouseenter', () => { paused = true; set(i); });
      it.addEventListener('focus', () => { set(i); hold(9000); });
      it.addEventListener('click', () => { set(i); hold(9000); });
    });
    acc.addEventListener('mouseleave', () => { paused = false; });
    new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { threshold: 0.35 }).observe(acc);
    if (!reduce) setInterval(() => { if (!paused && inView) set((idx + 1) % items.length); }, 3800);
  }

  function initForm() {
    const form = $('#cForm');
    if (!form) return;
    const note = $('#formNote');
    const noteText = $('span', note);
    const label = $('#submitLabel');
    const fields = {
      fn: { el: $('#fn'), msg: 'Escribe tu nombre.', ok: (v) => v.trim().length >= 2 },
      ft: { el: $('#ft'), msg: 'Escribe un teléfono válido.', ok: (v) => v.replace(/\D/g, '').length >= 8 },
      fs: { el: $('#fs'), msg: 'Selecciona un servicio.', ok: (v) => v !== '' },
      fm: { el: $('#fm'), msg: 'Cuéntanos brevemente tu proyecto.', ok: (v) => v.trim().length >= 6 },
    };
    const check = (key) => {
      const f = fields[key];
      const valid = f.ok(f.el.value);
      f.el.classList.toggle('is-invalid', !valid);
      f.el.setAttribute('aria-invalid', String(!valid));
      const err = $(`[data-err="${key}"]`);
      if (err) err.textContent = valid ? '' : f.msg;
      return valid;
    };
    Object.keys(fields).forEach((k) => {
      fields[k].el.addEventListener('blur', () => check(k));
      fields[k].el.addEventListener('input', () => { if (fields[k].el.classList.contains('is-invalid')) check(k); });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const valid = Object.keys(fields).map(check).every(Boolean);
      if (!valid) {
        const first = Object.values(fields).find((f) => f.el.classList.contains('is-invalid'));
        if (first) first.el.focus();
        return;
      }
      const text = [
        `Hola, soy ${fields.fn.el.value.trim()}.`,
        `Quiero cotizar: ${fields.fs.el.value}.`,
        `Proyecto: ${fields.fm.el.value.trim()}`,
        `Mi teléfono: ${fields.ft.el.value.trim()}`,
      ].join('\n');
      label.textContent = 'Abriendo WhatsApp';
      note.classList.add('is-ok');
      noteText.textContent = 'Listo. Se abrirá WhatsApp con tu mensaje.';
      setTimeout(() => {
        window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        label.textContent = 'Cotizar por WhatsApp';
        form.reset();
      }, 650);
    });
  }

  function initSpotlight() {
    if (!finePointer) return;
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    const cta = $('#cta');
    if (cta) cta.addEventListener('pointermove', (e) => {
      const r = cta.getBoundingClientRect();
      cta.style.setProperty('--mx', `${e.clientX - r.left}px`);
      cta.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }

  function initMagnetic() {
    if (!finePointer || !animate) return;
    $$('.mag').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.28,
          y: (e.clientY - (r.top + r.height / 2)) * 0.4,
          duration: 0.5, ease: 'power3.out', overwrite: 'auto',
        });
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.4)', overwrite: 'auto' });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Lenis                                                               */
  /* ------------------------------------------------------------------ */
  function initLenis() {
    if (typeof window.Lenis === 'undefined') return;
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------ */
  /* Loader                                                              */
  /* ------------------------------------------------------------------ */
  function runLoader() {
    return new Promise((resolve) => {
      const loader = $('#loader');
      if (!loader) return resolve();
      const fill = $('#ldFill');
      const pct = $('#ldPct');
      const bars = $$('.ld-bars i', loader);
      const core = $('.ld-core', loader);
      const st = { p: 0 };
      const render = () => {
        pct.textContent = pad(Math.round(st.p), 3);
        fill.style.transform = `scaleX(${st.p / 100})`;
      };
      let ready = d.readyState === 'complete';
      if (!ready) addEventListener('load', () => { ready = true; }, { once: true });
      if (lenis) lenis.stop();

      const exit = () => {
        const tl = gsap.timeline({ onComplete: () => { loader.style.display = 'none'; if (lenis) lenis.start(); } });
        tl.to(core, { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power2.in' })
          .to(bars, { scaleY: 0, duration: 1, ease: 'expo.inOut', stagger: { each: 0.07, from: 'center' } }, '-=0.1')
          .add(resolve, '-=0.55');
      };

      gsap.to(st, {
        p: 88, duration: 1.2, ease: 'power2.out', onUpdate: render,
        onComplete: () => {
          const started = performance.now();
          const wait = () => {
            if (ready || performance.now() - started > 3500) {
              gsap.to(st, { p: 100, duration: 0.5, ease: 'power2.inOut', onUpdate: render, onComplete: exit });
              gsap.ticker.remove(wait);
            }
          };
          gsap.ticker.add(wait);
        },
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero                                                                */
  /* ------------------------------------------------------------------ */
  function heroSetup() {
    const words = splitText($('.hero-h1'), true);
    gsap.set(words, { yPercent: 115 });
    gsap.set('.hero-h1 mark', { '--mk': 0 });
    gsap.set('#heroMedia', { clipPath: 'polygon(0 100%,88% 100%,100% 100%,100% 100%,12% 100%,0 100%)' });
    gsap.set('#heroImg', { scale: 1.35 });
    gsap.set('#heroBlock', { opacity: 0, x: -40, y: 40 });
    gsap.set('.hero-card', { opacity: 0, y: 50 });
    gsap.set('[data-hero]', { opacity: 0, y: 34 });
    return words;
  }

  function heroIntro(words) {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(words, { yPercent: 0, duration: 1.4, stagger: 0.08 }, 0)
      .to('.hero-h1 mark', { '--mk': 1, duration: 1.3, ease: 'expo.inOut' }, 0.7)
      .to('[data-hero]', { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.35)
      .to('#heroMedia', { clipPath: 'polygon(0 0,88% 0,100% 9%,100% 100%,12% 100%,0 91%)', duration: 1.5, ease: 'expo.inOut' }, 0.15)
      .to('#heroImg', { scale: 1, duration: 2, ease: 'expo.out' }, 0.15)
      .to('#heroBlock', { opacity: 1, x: 0, y: 0, duration: 1.4 }, 0.5)
      .to('.hero-card', { opacity: 1, y: 0, duration: 1.2, stagger: 0.15 }, 1);
    return tl;
  }

  function initHeroMotion() {
    const hero = $('#inicio');
    if (!hero) return;
    gsap.to('.hero-copy', {
      y: -70, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('#heroImg', {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });

    if (finePointer) {
      const img = $('#heroImg');
      const block = $('#heroBlock');
      const cards = $$('.hero-card');
      const qImgX = gsap.quickTo(img, 'x', { duration: 1.2, ease: 'power3' });
      const qImgY = gsap.quickTo(img, 'y', { duration: 1.2, ease: 'power3' });
      const qBlkX = gsap.quickTo(block, 'x', { duration: 1.4, ease: 'power3' });
      const qBlkY = gsap.quickTo(block, 'y', { duration: 1.4, ease: 'power3' });
      const cardQ = cards.map((c) => ({
        depth: parseFloat(c.dataset.depth || '20'),
        x: gsap.quickTo(c, 'x', { duration: 1.1, ease: 'power3' }),
        y: gsap.quickTo(c, 'y', { duration: 1.1, ease: 'power3' }),
      }));
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        qImgX(nx * -26); qImgY(ny * -20);
        qBlkX(nx * 22); qBlkY(ny * 22);
        cardQ.forEach((c) => { c.x(nx * c.depth); c.y(ny * c.depth); });
      });
    }
  }

  function initHeroGrid() {
    const hero = $('#inicio');
    const cv = $('#hero-grid');
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    const STEP = 64;
    let w = 0, h = 0, markers = [], visible = true;
    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999 };

    const newMarker = () => ({
      x: Math.floor(Math.random() * (w / STEP + 1)) * STEP,
      y: Math.floor(Math.random() * (h / STEP + 1)) * STEP,
      horiz: Math.random() > 0.5,
      dir: Math.random() > 0.5 ? 1 : -1,
      sp: 0.4 + Math.random() * 0.7,
    });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      markers = Array.from({ length: w < 700 ? 7 : 16 }, newMarker);
    };
    resize();
    addEventListener('resize', resize);

    hero.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);

    const draw = () => {
      requestAnimationFrame(draw);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(11,20,38,.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0.5; x < w; x += STEP) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0.5; y < h; y += STEP) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      mouse.sx += (mouse.x - mouse.sx) * 0.14;
      mouse.sy += (mouse.y - mouse.sy) * 0.14;
      if (mouse.sx > -900) {
        const R = 250;
        const x0 = Math.floor((mouse.sx - R) / STEP), x1 = Math.ceil((mouse.sx + R) / STEP);
        const y0 = Math.floor((mouse.sy - R) / STEP), y1 = Math.ceil((mouse.sy + R) / STEP);
        for (let gx = x0; gx <= x1; gx++) {
          for (let gy = y0; gy <= y1; gy++) {
            const x = gx * STEP + 0.5, y = gy * STEP + 0.5;
            const dist = Math.hypot(x - mouse.sx, y - mouse.sy);
            if (dist > R) continue;
            const a = 1 - dist / R;
            ctx.strokeStyle = `rgba(27,79,159,${a * 0.9})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
            ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
            ctx.stroke();
            if (dist < 90) { ctx.fillStyle = `rgba(255,184,28,${a})`; ctx.fillRect(x - 3, y - 3, 6, 6); }
          }
        }
      }

      markers.forEach((m) => {
        const prev = m.horiz ? m.x : m.y;
        if (m.horiz) m.x += m.sp * m.dir; else m.y += m.sp * m.dir;
        const cur = m.horiz ? m.x : m.y;
        if (Math.floor(prev / STEP) !== Math.floor(cur / STEP) && Math.random() < 0.35) {
          m.horiz = !m.horiz; m.dir = Math.random() > 0.5 ? 1 : -1;
          m.x = Math.round(m.x / STEP) * STEP; m.y = Math.round(m.y / STEP) * STEP;
        }
        if (m.x < -20 || m.x > w + 20 || m.y < -20 || m.y > h + 20) Object.assign(m, newMarker());
        const tx = m.horiz ? m.x - m.dir * 56 : m.x;
        const ty = m.horiz ? m.y : m.y - m.dir * 56;
        const g = ctx.createLinearGradient(tx, ty, m.x, m.y);
        g.addColorStop(0, 'rgba(255,184,28,0)');
        g.addColorStop(1, 'rgba(255,184,28,.9)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(m.x, m.y); ctx.stroke();
        ctx.fillStyle = '#FFB81C';
        ctx.fillRect(m.x - 3, m.y - 3, 6, 6);
      });
    };
    draw();
  }

  /* ------------------------------------------------------------------ */
  /* Secciones                                                           */
  /* ------------------------------------------------------------------ */
  function initTicker() {
    const track = $('#tickerTrack');
    if (!track) return;
    const group = $('.ticker-group', track);
    let guard = 0;
    while (track.scrollWidth < innerWidth * 2.6 && guard++ < 8) track.appendChild(group.cloneNode(true));
    const gw = group.getBoundingClientRect().width;
    const loop = gsap.to(track, { x: -gw, duration: gw / 95, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: '.ticker', start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      onUpdate: (self) => {
        const v = Math.abs(self.getVelocity());
        loop.timeScale(self.direction * (1 + Math.min(v / 320, 8)));
      },
    });
    ScrollTrigger.addEventListener('scrollEnd', () => gsap.to(loop, { timeScale: 1, duration: 0.9, ease: 'power2.out' }));
  }

  function initManifesto() {
    const text = $('#maniText');
    if (!text) return;
    const words = splitText(text, false);
    gsap.fromTo(words, { opacity: 0.16 }, {
      opacity: 1, ease: 'none', stagger: { each: 0.12 }, duration: 0.3,
      scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 52%', scrub: true },
    });
    $$('.mani-float').forEach((el) => {
      const sp = parseFloat(el.dataset.speed || '10');
      gsap.fromTo(el, { yPercent: -sp * 1.3 }, {
        yPercent: sp * 1.3, ease: 'none',
        scrollTrigger: { trigger: '#nosotros', start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.from(el, {
        clipPath: 'polygon(0 100%,88% 100%,100% 100%,100% 100%,12% 100%,0 100%)', duration: 1.5, ease: 'expo.inOut',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  function initStats() {
    const grid = $('.stats-grid');
    if (!grid) return;
    ScrollTrigger.create({
      trigger: grid, start: 'top 82%', once: true,
      onEnter: () => {
        $$('.stat-n', grid).forEach((el, i) => {
          const target = parseInt(el.dataset.count, 10) || 0;
          const o = { v: 0 };
          gsap.to(o, { v: target, duration: 1.8, delay: i * 0.12, ease: 'power3.out', onUpdate: () => { el.textContent = pad(Math.round(o.v)); } });
        });
        gsap.to($$('.stat', grid), { '--bar': 1, duration: 1.3, stagger: 0.14, ease: 'expo.out' });
      },
    });
  }

  function initServices(mm) {
    $$('[data-hs-img]').forEach((img) => { img.loading = 'eager'; });
    mm.add('(min-width: 900px)', () => {
      const pin = $('#hsPin');
      const track = $('#hsTrack');
      if (!pin || !track) return;
      const panels = $$('.hs-panel', track);
      const bar = $('#hsBar');
      const now = $('#hsNow');
      const dist = () => track.scrollWidth - innerWidth;

      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => {
            bar.style.transform = `scaleX(${self.progress})`;
            let best = 0, bd = Infinity;
            panels.forEach((p, i) => {
              const r = p.getBoundingClientRect();
              const dd = Math.abs(r.left + r.width / 2 - innerWidth * 0.5);
              if (dd < bd) { bd = dd; best = i; }
            });
            now.textContent = pad(best + 1);
          },
        },
      });
      $$('[data-hs-img]', track).forEach((img) => {
        gsap.fromTo(img, { xPercent: -7, scale: 1.2 }, {
          xPercent: 7, scale: 1.2, ease: 'none',
          scrollTrigger: { trigger: img.closest('.hs-panel'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      });
    });
  }

  function initStack(mm) {
    $$('[data-ghost]').forEach((g) => {
      gsap.fromTo(g, { xPercent: -5 }, {
        xPercent: 7, ease: 'none',
        scrollTrigger: { trigger: g.closest('.scard'), start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    $$('.scard-media [data-par]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    $$('.scard').forEach((card) => {
      gsap.from($$('.scard-copy > *', card), {
        y: 44, opacity: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 62%', once: true },
      });
      gsap.from($('.scard-media', card), {
        clipPath: 'polygon(0 100%,88% 100%,100% 100%,100% 100%,12% 100%,0 100%)', duration: 1.5, ease: 'expo.inOut',
        scrollTrigger: { trigger: card, start: 'top 62%', once: true },
      });
    });
    mm.add('(min-width: 900px)', () => {
      const cards = $$('.scard');
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        const trigger = { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true };
        gsap.to($('.scard-inner', card), { scale: 0.9, y: -28, ease: 'none', scrollTrigger: trigger });
        gsap.to($('.scard-shade', card), { opacity: 0.6, ease: 'none', scrollTrigger: trigger });
      });
    });
  }

  function initMaterials() {
    const items = $$('.acc-item');
    if (!items.length) return;
    gsap.from(items, {
      y: 90, opacity: 0, duration: 1.3, stagger: 0.14, ease: 'expo.out',
      scrollTrigger: { trigger: '#acc', start: 'top 82%', once: true },
    });
  }

  function initRemodel() {
    $$('.remo-img').forEach((box) => {
      ScrollTrigger.create({
        trigger: box, start: 'top 86%', once: true,
        onEnter: () => gsap.fromTo(box, { clipPath: 'inset(0% 0% 100% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut',
          onComplete: () => box.classList.add('is-in'),
        }),
      });
      const img = $('img', box);
      const dir = box.closest('.rf-2') ? -1 : 1;
      gsap.fromTo(img, { yPercent: -8 * dir }, {
        yPercent: 8 * dir, ease: 'none',
        scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  function initProcess(mm) {
    mm.add('(min-width: 900px)', () => {
      const pin = $('#procPin');
      const slides = $$('.proc-slide');
      const items = $$('#procList li');
      const fill = $('#procFill');
      if (!pin || !slides.length) return;
      let cur = 0;
      gsap.set(slides, { autoAlpha: 0, y: 40 });
      gsap.set(slides[0], { autoAlpha: 1, y: 0 });
      const show = (n) => {
        if (n === cur) return;
        const dir = n > cur ? 1 : -1;
        gsap.to(slides[cur], { autoAlpha: 0, y: -44 * dir, duration: 0.45, ease: 'power2.in', overwrite: true });
        gsap.fromTo(slides[n], { autoAlpha: 0, y: 56 * dir }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.2, ease: 'expo.out', overwrite: true });
        items.forEach((li, i) => li.classList.toggle('is-on', i <= n));
        cur = n;
      };
      ScrollTrigger.create({
        trigger: pin, start: 'top top', end: '+=320%', pin: true, scrub: true, anticipatePin: 1,
        onUpdate: (self) => {
          fill.style.transform = `scaleY(${self.progress})`;
          show(Math.min(slides.length - 1, Math.floor(self.progress * slides.length)));
        },
      });
    });
    mm.add('(max-width: 899px)', () => {
      $$('.proc-slide').forEach((s) => {
        gsap.from(s, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 88%', once: true } });
      });
    });
  }

  function initGenericReveals() {
    $$('[data-split]').forEach((el) => {
      if (el.classList.contains('hero-h1')) return;
      const words = splitText(el, true);
      gsap.set(words, { yPercent: 115 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.2, stagger: 0.055, ease: 'expo.out' }),
      });
    });
    ScrollTrigger.batch('.rev', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, {
        opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out',
        onComplete: () => els.forEach((el) => { el.classList.add('is-in'); gsap.set(el, { clearProps: 'opacity,transform' }); }),
      }),
    });
  }

  function initGlobalScroll() {
    const nav = $('#nav');
    const fill = $('#scrollbar-fill');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        fill.style.transform = `scaleX(${self.progress})`;
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 60);
        if (d.body.classList.contains('menu-open')) return;
        if (y > 500 && self.direction === 1) nav.classList.add('is-hidden');
        else if (self.direction === -1 || y <= 500) nav.classList.remove('is-hidden');
      },
    });
  }

  /* ------------------------------------------------------------------ */
  /* Arranque                                                            */
  /* ------------------------------------------------------------------ */
  function simpleFinish() {
    const loader = $('#loader');
    if (loader) loader.style.display = 'none';
    $$('.stat-n').forEach((el) => { el.textContent = pad(el.dataset.count || 0); });
    initNavFallback();
  }

  function boot() {
    initMenu();
    initAnchors();
    initAccordion();
    initForm();
    initSpotlight();

    if (!animate) { simpleFinish(); return; }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    initLenis();
    initMagnetic();

    const heroWords = heroSetup();
    initHeroMotion();
    initHeroGrid();

    const mm = gsap.matchMedia();
    initTicker();
    initManifesto();
    initStats();
    initServices(mm);
    initStack(mm);
    initMaterials();
    initRemodel();
    initProcess(mm);
    initGenericReveals();
    initGlobalScroll();

    runLoader().then(() => heroIntro(heroWords));

    const refresh = () => ScrollTrigger.refresh();
    addEventListener('load', refresh);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(refresh);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
