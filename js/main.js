// Shared behaviour: mobile nav, today's hours, card tilt, gallery lightbox.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile nav
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
  }

  // Highlight today in any hours table (rows carry data-day = JS getDay() index)
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' })).getDay(); // shop's day, not visitor's
  document.querySelectorAll(`.hours tr[data-day="${today}"]`).forEach((tr) => tr.classList.add('is-today'));

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // 3D tilt on team cards, pointer-driven only
  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.member-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Gallery lightbox using native <dialog> (focus trap + Esc for free)
  const dialog = document.getElementById('lightbox');
  const items = [...document.querySelectorAll('.g-item')];
  if (dialog && items.length) {
    const img = dialog.querySelector('.lb-img');
    const caption = dialog.querySelector('figcaption');
    const counter = dialog.querySelector('.lb-count');
    let index = 0;

    const show = (i) => {
      index = (i + items.length) % items.length;
      const src = items[index];
      img.src = src.dataset.src;
      img.alt = src.dataset.alt;
      caption.textContent = src.dataset.caption;
      counter.textContent = `${index + 1} of ${items.length}`;
    };

    items.forEach((btn, i) => btn.addEventListener('click', () => { show(i); dialog.showModal(); }));
    dialog.querySelector('[data-lb="prev"]').addEventListener('click', () => show(index - 1));
    dialog.querySelector('[data-lb="next"]').addEventListener('click', () => show(index + 1));
    dialog.querySelector('[data-lb="close"]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => items[index].focus());
  }
})();
