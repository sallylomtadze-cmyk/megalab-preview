// shared behaviour for every page of the Megalab redesign
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gel = v => Number(v).toLocaleString('ka-GE').replace(/,/g, ' ') + ' ₾';

// scroll reveal: .rv fades up, siblings stagger
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  if (e.target.dataset.count) count(e.target);
}), { threshold: 0, rootMargin: '0px 0px -8% 0px' });
function reveal(root = document) {
  $$('.rv:not(.in)', root).forEach(el => {
    if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', [...el.parentNode.children].filter(c => c.classList.contains('rv')).indexOf(el) % 8);
    io.observe(el);
  });
  $$('[data-count]', root).forEach(el => io.observe(el));
}
function count(el) {
  const to = +el.dataset.count, dec = +el.dataset.dec || 0, t0 = performance.now(), d = 1800;
  (function f(t) {
    const k = Math.min(1, (t - t0) / d), v = to * (1 - Math.pow(1 - k, 3));
    el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en').replace(/,/g, ' ');
    if (k < 1) requestAnimationFrame(f);
  })(t0);
}
reveal();

// header: shrink on scroll, burger, search goes to the tests catalogue
const nav = $('header.nav');
addEventListener('scroll', () => nav.classList.toggle('s', scrollY > 30), { passive: true });
$('.burger')?.addEventListener('click', () => $('.menu').classList.toggle('open'));
$$('form[data-search]').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault(); location.href = 'tests.html?search=' + encodeURIComponent(f.querySelector('input').value.trim());
}));

// mark the current page in the menu
{ const here = location.pathname.split('/').pop() || 'index.html'; $$('.sub a').forEach(a => { if (a.getAttribute('href') === here) { a.classList.add('cur'); a.closest('li').classList.add('cur'); a.setAttribute('aria-current', 'page'); } }); }

// mouse parallax for [data-px="12"] (pixels of travel)
if (matchMedia('(hover:hover)').matches) addEventListener('mousemove', e => {
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  $$('[data-px]').forEach(el => el.style.translate = `${x * el.dataset.px}px ${y * el.dataset.px}px`);
});

// carousels: [data-car] wraps .car and .arrows; data-auto="4000" autoplays
$$('[data-car]').forEach(w => {
  const c = $('.car', w), step = d => {
    const end = c.scrollLeft + c.clientWidth >= c.scrollWidth - 8;
    c.scrollTo({ left: d > 0 && end ? 0 : c.scrollLeft + d * Math.min(c.clientWidth * .8, 700), behavior: 'smooth' });
  };
  $$('.arrows button', w).forEach((b, i) => b.addEventListener('click', () => step(i ? 1 : -1)));
  if (w.dataset.auto) { let t = setInterval(step, +w.dataset.auto, 1); w.addEventListener('pointerenter', () => clearInterval(t)); }
});

// tabs: [data-tabs] buttons switch [data-tab] panes inside the same panel
$$('[data-tabs]').forEach(t => $$('button', t).forEach((b, i) => b.addEventListener('click', () => {
  $$('button', t).forEach(x => x.classList.toggle('on', x === b));
  $$('[data-tab]', t.closest('.panel')).forEach((p, j) => { p.hidden = i !== j; if (i === j) $$('.rv', p).forEach(r => r.classList.add('in')); });
})));

// lazy YouTube: thumbnail first, iframe on click
$$('.th[data-yt]').forEach(th => th.addEventListener('click', () => {
  th.outerHTML = `<iframe src="https://www.youtube.com/embed/${th.dataset.yt}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}));

// gallery lightbox
const lb = Object.assign(document.createElement('div'), { className: 'lb', innerHTML: '<img alt="">' });
document.body.append(lb); lb.onclick = () => lb.classList.remove('on');
$$('.gal img').forEach(i => i.addEventListener('click', () => { $('img', lb).src = i.src; lb.classList.add('on'); }));

// drawer helper used by the tests and packages pages
function drawer(html) {
  let d = $('.drawer');
  if (!d) {
    d = Object.assign(document.createElement('div'), { className: 'drawer', innerHTML: '<div class="bg"></div><div class="pan"></div>' });
    document.body.append(d); $('.bg', d).onclick = () => d.classList.remove('on');
    addEventListener('keydown', e => e.key === 'Escape' && d.classList.remove('on'));
  }
  $('.pan', d).innerHTML = '<button class="x" aria-label="დახურვა"><i class="ph-duotone ph-x"></i></button>' + html;
  $('.x', d).onclick = () => d.classList.remove('on');
  $('.pan', d).scrollTop = 0; requestAnimationFrame(() => d.classList.add('on'));
}
const LABELS = { testDescription: 'კვლევის აღწერა', whenToTake: 'როდის უნდა ჩატარდეს', requirements: 'მომზადება კვლევისთვის', methodology: 'მეთოდი', interpretation: 'შედეგის ინტერპრეტაცია', additionalTestsTaken: 'დამატებითი კვლევები', authorAndSource: 'ავტორი და წყარო' };
function detail(o, top) {
  const kv = [['პასუხის ვადა', o.tat], ['საკვლევი მასალა', o.sampleType], ['ქვეყანა', o.country], ['კვლევის კოდი', o.testCode], ['NCSP კოდი', o.ncspCode], ['კვლევის ნომერი', /^\d+$/.test(o.testNumber) ? o.testNumber : '']].filter(x => x[1]);
  return top + (kv.length ? '<div class="kv">' + kv.map(([k, v]) => `<div><small>${k}</small>${esc(v)}</div>`).join('') + '</div>' : '') +
    Object.entries(LABELS).filter(([k]) => o[k] && o[k].replace(/<[^>]+>|&nbsp;|\s/g, '')).map(([k, l]) => `<h5>${l}</h5><div class="bx">${o[k]}</div>`).join('') +
    '<p style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="reservation.html">ვიზიტის დაჯავშნა</a><a class="btn o" href="tel:+995322051111"><i class="ph-duotone ph-phone"></i>+995 32 2 051 111</a></p>';
}
const flags = o => `<span class="tags">${o.isHome ? '<span class="tag"><i class="ph-duotone ph-house-line"></i>ბინაზე</span>' : ''}${o.isDrive ? '<span class="tag g"><i class="ph-duotone ph-car-profile"></i>დრაივი</span>' : ''}</span>`;
function priceHtml(full, now) {
  return +now && +now < +full ? `<span class="price">${gel(now)}</span><span class="old">${gel(full)}</span><span class="save">-${gel(full - now)}</span>` : `<span class="price">${gel(full)}</span>`;
}
function pkgCard(p) {
  return `<button class="pk rv" data-id="${p.id}"><h3>${esc(p.name)}</h3>${flags(p)}<p class="tn">${esc(p.testNamesCombined || '')}</p><div class="pr">${priceHtml(p.totalPrice, p.priceAfterDiscount)}</div></button>`;
}
function openPkg(p) {
  drawer(detail(p, `<h2>${esc(p.name)}</h2>${flags(p)}<div class="pr" style="display:flex;gap:10px;align-items:baseline;margin-top:12px">${priceHtml(p.totalPrice, p.priceAfterDiscount)}</div>` +
    (p.testNamesCombined ? `<h5>ნაკრებში შემავალი კვლევები</h5><div class="bx"><ul style="padding-left:18px">${p.testNamesCombined.split(';').filter(s => s.trim()).map(s => `<li>${esc(s.trim())}</li>`).join('')}</ul></div>` : '')));
}

// ?y=1200 opens the page already scrolled there (screenshots, recordings)
const y0 = new URLSearchParams(location.search).get('y');
if (y0) addEventListener('load', () => { $$('.rv').forEach(r => r.classList.add('in')); scrollTo({ top: +y0, behavior: 'instant' }); });

// phone: category lists start short, one tap shows the rest
$$('[data-showall]').forEach(b => b.addEventListener('click', () => { $$('.cats').forEach(c => c.classList.remove('more')); b.remove(); }));

// JCI facts: open on desktop, tap-to-open on phones
if (matchMedia('(min-width:761px)').matches) $$('.duo details').forEach(d => d.open = true);
// footer link groups collapse on phones
if (matchMedia('(max-width:760px)').matches) $$('footer .g > div:not(.lg)').forEach(g => { const h = g.querySelector('h4'); if (!h) return; g.classList.add('fg'); h.addEventListener('click', () => g.classList.toggle('open')); });
