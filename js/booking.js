// Booking form: front-end only. Validates, builds time slots from opening hours, shows a confirmation.
(() => {
  const form = document.getElementById('booking-form');
  if (!form) return;
  const { slotsFor, serviceAllowed } = window.HHSlots;

  const service = form.elements.service;
  const date = form.elements.date;
  const slotBox = document.getElementById('slots');
  const confirm = document.getElementById('confirmation');
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // The shop's clock, not the visitor's: a Date whose local fields read as UK time.
  const ukNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const today = ukNow();
  date.min = iso(today);
  const max = new Date(today); max.setDate(max.getDate() + 60);
  date.max = iso(max);

  const dayOf = () => (date.value ? new Date(date.value + 'T12:00').getDay() : null);
  const durationOf = () => Number(service.selectedOptions[0]?.dataset.min || 30);

  function setError(input, msg) {
    const el = document.getElementById(input.id + '-error') || document.getElementById(input.name + '-error');
    if (el) el.textContent = msg;
    if (input.setAttribute) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  function renderSlots() {
    const day = dayOf();
    slotBox.innerHTML = '';
    if (day === null) { slotBox.innerHTML = '<p class="slots-empty">Pick a date to see available times.</p>'; return; }
    const slots = slotsFor(day, durationOf());
    if (!slots.length) { slotBox.innerHTML = '<p class="slots-empty">We’re closed on Mondays. Please choose another day.</p>'; return; }
    const now = ukNow();
    const isToday = date.value === iso(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    slots.forEach((s) => {
      if (isToday && s.minutes <= nowMin) return;
      const label = document.createElement('label');
      label.innerHTML = `<input type="radio" name="time" value="${s.value}" required><span>${s.value}</span>`;
      slotBox.appendChild(label);
    });
    if (!slotBox.children.length) slotBox.innerHTML = '<p class="slots-empty">No times left today. Please choose another day.</p>';
  }

  service.addEventListener('change', () => { if (date.value) validateDate(); renderSlots(); });
  date.addEventListener('change', () => { validateDate(); renderSlots(); });
  renderSlots();

  function validateDate() {
    const day = dayOf();
    if (!date.value) return setError(date, 'Choose a date.');
    if (date.value < date.min || date.value > date.max) return setError(date, 'Choose a date within the next 60 days.');
    if (day === 1) return setError(date, 'We’re closed on Mondays.');
    if (!serviceAllowed(service.value, day)) return setError(date, 'Senior Cut is available Tuesday to Thursday only.');
    return setError(date, '');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.elements.name, phone = form.elements.phone;
    const ok = [
      setError(name, name.value.trim().length >= 2 ? '' : 'Enter your name.'),
      setError(phone, phone.value.replace(/\D/g, '').length >= 10 ? '' : 'Enter a phone number we can reach you on.'),
      setError(service, service.value ? '' : 'Choose a service.'),
      validateDate(),
    ];
    const time = form.querySelector('input[name="time"]:checked');
    ok.push(setError({ id: 'time' }, time ? '' : 'Choose a time.'));

    if (ok.includes(false)) {
      (form.querySelector('[aria-invalid="true"]') || slotBox.querySelector('input'))?.focus();
      return;
    }

    const d = new Date(date.value + 'T12:00');
    const rows = {
      Name: name.value.trim(),
      Service: service.selectedOptions[0].textContent,
      Barber: form.elements.barber.value,
      When: `${DAY_NAMES[d.getDay()]} ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} at ${time.value}`,
      Phone: phone.value.trim(),
    };
    const dl = confirm.querySelector('dl');
    dl.innerHTML = '';
    for (const [k, v] of Object.entries(rows)) {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v; // textContent: no HTML injection
      dl.append(dt, dd);
    }
    confirm.querySelector('.confirm-name').textContent = rows.Name.split(' ')[0];
    form.hidden = true;
    confirm.hidden = false;
    confirm.focus();
  });

  document.getElementById('book-another')?.addEventListener('click', () => {
    form.reset(); renderSlots();
    confirm.hidden = true; form.hidden = false;
    form.elements.name.focus();
  });
})();
