// Opening-hours logic for the booking form. Works in the browser (window.HHSlots) and in Node (module.exports).
(function (root) {
  // Index = Date.getDay() (0 = Sunday). Times in minutes from midnight. null = closed.
  const HOURS = [
    [600, 900],   // Sun 10:00–15:00
    null,         // Mon closed
    [540, 1110],  // Tue 9:00–18:30
    [540, 1110],  // Wed
    [540, 1200],  // Thu 9:00–20:00 (late night)
    [540, 1110],  // Fri
    [510, 1020],  // Sat 8:30–17:00
  ];

  const fmt = (m) => {
    const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
    return `${((h + 11) % 12) + 1}:${mm}${h < 12 ? 'am' : 'pm'}`;
  };

  // Start times every 30 min where the appointment finishes by closing.
  function slotsFor(day, duration) {
    const h = HOURS[day];
    if (!h) return [];
    const out = [];
    for (let t = h[0]; t + duration <= h[1]; t += 30) out.push({ value: fmt(t), minutes: t });
    return out;
  }

  // Senior cut is Tue–Thu only.
  const serviceAllowed = (service, day) => service !== 'senior' || (day >= 2 && day <= 4);

  const api = { HOURS, slotsFor, serviceAllowed, fmt };
  if (typeof module !== 'undefined') module.exports = api; else root.HHSlots = api;
})(this);
