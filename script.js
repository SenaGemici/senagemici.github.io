(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- language ---------- */
  const TITLES = { tr: 'Sena Gemicioğlu · Junior Veri Analisti', en: 'Sena Gemicioğlu · Junior Data Analyst' };
  const PHRASES = {
    tr: ['SELECT kanal, AVG(kazanildi) FROM firsatlar GROUP BY kanal;', 'df.drop_duplicates().groupby("segment").agg(["mean", "count"])',
         'Kazanılan Gelir = CALCULATE(SUM(Firsat[Tutar]), Firsat[Durum] = "Won")', 'model.fit(X_train, y_train)  # AUC 0.747',
         'claude "satış verisindeki tutarsız kayıtları bul"'],
    en: ['SELECT channel, AVG(is_won) FROM deals GROUP BY channel;', 'df.drop_duplicates().groupby("segment").agg(["mean", "count"])',
         'Won Revenue = CALCULATE(SUM(Deals[Amount]), Deals[Status] = "Won")', 'model.fit(X_train, y_train)  # AUC 0.747',
         'claude "find inconsistent records in the sales data"'],
  };
  const detect = () => (navigator.language || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  let lang;
  try { lang = localStorage.getItem('lang') || detect(); } catch { lang = detect(); }

  function setLang(l) {
    lang = l; root.dataset.lang = l; root.lang = l; document.title = TITLES[l];
    try { localStorage.setItem('lang', l); } catch {}
    restartTyping();
  }
  document.getElementById('langBtn').addEventListener('click', () => setLang(lang === 'tr' ? 'en' : 'tr'));

  /* ---------- typing ---------- */
  const typed = document.getElementById('typed');
  let timer, pi = 0, ci = 0, deleting = false;
  function tick() {
    const list = PHRASES[lang], text = list[pi % list.length];
    if (reduce) { typed.textContent = text; return; }
    ci += deleting ? -1 : 1;
    typed.textContent = text.slice(0, ci);
    let delay = deleting ? 18 : 42;
    if (!deleting && ci === text.length) { deleting = true; delay = 1900; }
    else if (deleting && ci === 0) { deleting = false; pi++; delay = 300; }
    timer = setTimeout(tick, delay);
  }
  function restartTyping() { clearTimeout(timer); ci = 0; deleting = false; tick(); }

  /* ---------- reveal + counters ---------- */
  const countUp = el => {
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = pre + target.toFixed(dec) + suf; return; }
    const start = performance.now(), dur = 1500;
    const step = now => {
      const p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.transitionDelay = Math.min(Math.max(sibs.indexOf(el), 0), 5) * 80 + 'ms';
    el.classList.add('in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(el);
  }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- project filter ---------- */
  const filterBtns = document.querySelectorAll('.filters button');
  const cards = document.querySelectorAll('#projectGrid .card');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.toggle('active', b === btn));
    const f = btn.dataset.filter;
    cards.forEach(c => {
      const show = f === 'all' || c.dataset.cat.split(' ').includes(f);
      c.classList.toggle('hide', !show);
      if (show) { c.classList.add('in'); c.style.transitionDelay = '0ms'; }
    });
  }));

  /* ---------- nav + progress ---------- */
  const nav = document.querySelector('.nav'), bar = document.querySelector('.progress');
  const links = [...document.querySelectorAll('.links a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    let cur = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach((a, i) => a.classList.toggle('active', i === cur));
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- hero chart (inside the card, so it never overlaps text) ---------- */
  const canvas = document.getElementById('chart'), ctx = canvas.getContext('2d');
  const N = 16;
  const actual = Array.from({ length: N }, (_, i) => 0.22 + i * 0.038 + Math.sin(i * 1.25) * 0.07);
  const forecast = actual.map((v, i) => v + Math.cos(i * 0.9) * 0.035);
  let W = 0, H = 0, t0 = null, visible = true;
  function size() {
    const r = canvas.getBoundingClientRect(), d = devicePixelRatio || 1;
    W = r.width; H = r.height; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function path(vals, ease, t, amp) {
    const shown = Math.max(2, Math.ceil(N * ease));
    return vals.slice(0, shown).map((v, i) => {
      const wave = reduce ? 0 : Math.sin(t * 1.2 + i * 0.6) * amp;
      return [8 + (W - 16) * i / (N - 1), 8 + (H - 24) * (1 - (v + wave))];
    });
  }
  function draw(now) {
    if (t0 === null) t0 = now;
    const t = (now - t0) / 1000, ease = reduce ? 1 : 1 - Math.pow(1 - Math.min(t / 1.8, 1), 3);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
    for (let g = 1; g <= 3; g++) { const y = 8 + (H - 24) * g / 4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // bars
    const bw = (W - 16) / N * 0.42;
    actual.forEach((v, i) => {
      const x = 8 + (W - 16) * i / (N - 1), hgt = (H - 24) * v * 0.55 * ease;
      ctx.fillStyle = 'rgba(123,155,255,.16)';
      ctx.beginPath(); ctx.roundRect(x - bw / 2, H - 16 - hgt, bw, hgt, 3); ctx.fill();
    });
    // forecast (dashed)
    const fp = path(forecast, ease, t, 0.012);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(179,157,255,.75)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); fp.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]);
    // actual line + area
    const ap = path(actual, ease, t, 0.02);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(91,128,255,.35)'); grad.addColorStop(1, 'rgba(91,128,255,0)');
    ctx.beginPath(); ap.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.lineTo(ap[ap.length - 1][0], H - 16); ctx.lineTo(ap[0][0], H - 16); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#7b9bff'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ap.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    const [lx, ly] = ap[ap.length - 1];
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(123,155,255,' + (0.25 + 0.2 * Math.sin(t * 3)) + ')'; ctx.beginPath(); ctx.arc(lx, ly, 10, 0, Math.PI * 2); ctx.fill();
    if (!reduce && visible) requestAnimationFrame(draw);
  }
  new IntersectionObserver(([e]) => {
    const was = visible; visible = e.isIntersecting;
    if (visible && !was) requestAnimationFrame(draw);
  }).observe(canvas);
  new ResizeObserver(size).observe(canvas);
  size();
  requestAnimationFrame(draw);

  /* ---------- hero: spotlight + grid highlight follow the mouse, card tilts slightly ---------- */
  const hero = document.querySelector('.hero'), card = document.querySelector('.hero-card');
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const loop = () => {
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;   // smooth trailing
      hero.style.setProperty('--mx', cx + 'px'); hero.style.setProperty('--my', cy + 'px');
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(loop) : null;
    };
    hero.addEventListener('pointerenter', e => {
      const r = hero.getBoundingClientRect(); cx = tx = e.clientX - r.left; cy = ty = e.clientY - r.top;
      hero.classList.add('pointer'); loop();
    });
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(loop);
      if (card.classList.contains('in')) {
        const c = card.getBoundingClientRect();
        const dx = (e.clientX - (c.left + c.width / 2)) / innerWidth, dy = (e.clientY - (c.top + c.height / 2)) / innerHeight;
        card.style.transform = `perspective(1200px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg)`;
      }
    });
    hero.addEventListener('pointerleave', () => { hero.classList.remove('pointer'); card.style.transform = ''; });
  }

  setLang(lang);
  onScroll();
})();
