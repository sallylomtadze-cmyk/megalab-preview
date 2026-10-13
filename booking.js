// Visit booking: branch -> date and time -> contact details. Mounts into #booking, needs data/site.js and base.js.
(() => {
  const root = $('#booking'); if (!root) return;
  const B = SITE.branches, MON = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'], WD = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვ'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const S = { step: 0, b: B.find(b => b.publicId === new URLSearchParams(location.search).get('b')) || null, d: null, t: null, m: new Date(today.getFullYear(), today.getMonth(), 1), q: '' };
  if (S.b) S.step = 1;
  const mins = s => { const [h, m] = s.split(':'); return h * 60 + +m; }, pad = n => String(n).padStart(2, '0');
  const hours = b => b.is24_7 ? 'ყოველდღე, 24/7' : (b.isEveryday ? 'ყოველდღე' : 'ორშაბათი - შაბათი') + ', ' + b.workingDayStartHour + ' - ' + b.workingDayEndHour;
  const closed = d => d < today || (!S.b.is24_7 && !S.b.isEveryday && d.getDay() === 0);
  const nice = d => d.getDate() + ' ' + MON[d.getMonth()] + ', ' + d.getFullYear();
  function slots() {
    const a = S.b.is24_7 ? 0 : mins(S.b.workingDayStartHour), z = S.b.is24_7 ? 1440 : mins(S.b.workingDayEndHour), now = new Date(), out = [];
    for (let t = a; t < z; t += 30) if (+S.d !== +today || t > now.getHours() * 60 + now.getMinutes()) out.push(pad(t / 60 | 0) + ':' + pad(t % 60));
    return out;
  }
  const STEPS = ['ფილიალი', 'თარიღი და დრო', 'თქვენი მონაცემები'];
  const views = [
    () => `<input class="inp" id="bq" placeholder="ფილიალის ან მისამართის ძებნა" aria-label="ძებნა" value="${esc(S.q)}">
      <div class="bk-list">${B.filter(b => (b.name + ' ' + b.address).toLowerCase().includes(S.q.toLowerCase())).map(b => `<button class="bk-b ${S.b === b ? 'on' : ''}" data-b="${b.publicId}"><b>${esc(b.name)}</b><span>${esc(b.address)}</span><small>${hours(b)}</small></button>`).join('') || '<p class="empty">ფილიალი ვერ მოიძებნა</p>'}</div>`,
    () => {
      const y = S.m.getFullYear(), mo = S.m.getMonth(), first = (new Date(y, mo, 1).getDay() + 6) % 7, n = new Date(y, mo + 1, 0).getDate();
      let cells = WD.map(w => `<i>${w}</i>`).join('') + '<span></span>'.repeat(first);
      for (let d = 1; d <= n; d++) { const dt = new Date(y, mo, d); cells += `<button ${closed(dt) ? 'disabled' : ''} class="${+dt === +today ? 'now ' : ''}${S.d && +dt === +S.d ? 'on' : ''}" data-d="${d}">${d}</button>`; }
      const sl = S.d ? slots() : [];
      return `<div class="bk-dt"><div class="cal"><div class="cal-h"><button data-m="-1" aria-label="წინა თვე" ${S.m <= new Date(today.getFullYear(), today.getMonth(), 1) ? 'disabled' : ''}><i class="ph-duotone ph-caret-left"></i></button><b>${MON[mo]} ${y}</b><button data-m="1" aria-label="შემდეგი თვე"><i class="ph-duotone ph-caret-right"></i></button></div><div class="cal-g">${cells}</div></div>
        <div class="bk-t"><b>${S.d ? nice(S.d) : 'აირჩიეთ თარიღი'}</b><div class="bk-slots">${S.d ? (sl.map(t => `<button class="${S.t === t ? 'on' : ''}" data-t="${t}">${t}</button>`).join('') || '<p class="empty">ამ დღეს თავისუფალი დრო აღარ არის</p>') : ''}</div></div></div>
        <div class="bk-nav"><button class="btn o" data-go="0">უკან</button><button class="btn" data-go="2" ${S.d && S.t ? '' : 'disabled'}>გაგრძელება</button></div>`;
    },
    () => `<form class="form" id="bf" novalidate><label class="field">სახელი<input name="name" required autocomplete="given-name"></label><label class="field">გვარი<input name="surname" required autocomplete="family-name"></label>
      <label class="field">ელ-ფოსტა<input name="email" type="email" required autocomplete="email"></label><label class="field">ტელეფონის ნომერი<input name="phone" type="tel" required pattern="[0-9+ ]{9,16}" autocomplete="tel"></label>
      <div class="bk-nav full"><button type="button" class="btn o" data-go="1">უკან</button><button class="btn">დაჯავშნა</button></div></form>`,
  ];
  function draw() {
    const sum = [S.b && S.b.name, S.d && S.t && nice(S.d) + ', ' + S.t];
    root.innerHTML = `<div class="bk-steps">${STEPS.map((s, i) => `<button class="${i === S.step ? 'on' : ''} ${i < S.step ? 'done' : ''}" data-go="${i}" ${i > S.step ? 'disabled' : ''}><u>${i < S.step ? '<i class="ph-duotone ph-check"></i>' : i + 1}</u><span>${s}${sum[i] ? `<small>${esc(sum[i])}</small>` : ''}</span></button>`).join('')}</div><div class="bk-body">${views[S.step]()}</div>`;
    const q = $('#bq', root); if (q) q.oninput = () => { S.q = q.value; const p = q.selectionStart; draw(); const n = $('#bq', root); n.focus(); n.setSelectionRange(p, p); };
    const f = $('#bf', root); if (f) f.onsubmit = e => {
      e.preventDefault(); let ok = true;
      $$('[required]', f).forEach(i => { const bad = !i.checkValidity(); i.closest('.field').classList.toggle('bad', bad); if (bad) ok = false; });
      if (!ok) return;
      // ponytail: demo only, nothing is sent; post to the reservation API when the site goes live
      root.innerHTML = `<div class="bk-ok"><i class="ph-duotone ph-check-circle"></i><h3>ვიზიტი დაჯავშნილია</h3><p>${esc(f.name.value)} ${esc(f.surname.value)}<br>${esc(S.b.name)}, ${esc(S.b.address)}<br>${nice(S.d)}, ${S.t}</p><button class="btn o" onclick="location.reload()">ახალი ჯავშანი</button></div>`;
    };
  }
  root.addEventListener('click', e => {
    const el = e.target.closest('button'); if (!el || el.disabled) return;
    const d = el.dataset;
    if (d.b) { S.b = B.find(b => b.publicId === d.b); S.d = S.t = null; S.step = 1; }
    else if (d.m) S.m = new Date(S.m.getFullYear(), S.m.getMonth() + +d.m, 1);
    else if (d.d) { S.d = new Date(S.m.getFullYear(), S.m.getMonth(), +d.d); S.t = null; }
    else if (d.t) S.t = d.t;
    else if (d.go) S.step = +d.go;
    else return;
    draw();
  });
  draw();
})();
