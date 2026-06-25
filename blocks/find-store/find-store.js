// synthetic fixture — no sample data available from Action Planner
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Fréscopa Downtown',
    address: '128 Market Street, San Francisco, CA 94103',
    phone: '(415) 555-0182',
    hours: 'Mon–Fri 7am–7pm · Sat–Sun 8am–5pm',
  },
  {
    name: 'Fréscopa Riverside',
    address: '47 Embarcadero Plaza, San Francisco, CA 94111',
    phone: '(415) 555-0247',
    hours: 'Daily 6:30am–8pm',
  },
];

// Brand palette from BuildWidgetRequest — used to derive card background.
const PALETTE = ['#00647d', '#a33532', '#dc6e52', '#eba439', '#58181d'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);
const ACCENT = PALETTE[0] || '#00647d';

export default async function decorate(block, bridge) {
  let stores = [];

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      stores = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.stores — bare array outputSchema; key derived from actionName "find_store"
      stores = structuredContent?.stores || [];
    }
  } else {
    stores = SAMPLE_DATA;
  }

  render(block, stores, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function pinIcon(color) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z');
  path.setAttribute('fill', color);
  svg.appendChild(path);
  return svg;
}

function render(block, stores, bridge) {
  block.textContent = '';

  if (!stores || stores.length === 0) {
    block.appendChild(buildSearchCard(bridge));
    return;
  }

  const list = document.createElement('div');
  list.className = 'find-store-results';
  list.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  stores.slice(0, 2).forEach((store) => {
    const card = document.createElement('div');
    card.className = 'find-store-card';

    const pin = document.createElement('div');
    pin.className = 'find-store-pin';
    pin.appendChild(pinIcon(theme?.fg ?? '#fff'));
    card.appendChild(pin);

    const body = document.createElement('div');
    body.className = 'find-store-body';

    const name = document.createElement('h3');
    name.className = 'find-store-name';
    name.textContent = store.name || '';
    body.appendChild(name);

    if (store.address) {
      const addr = document.createElement('p');
      addr.className = 'find-store-address';
      addr.textContent = store.address;
      body.appendChild(addr);
    }

    if (store.phone) {
      const phone = document.createElement('p');
      phone.className = 'find-store-phone';
      phone.textContent = store.phone;
      body.appendChild(phone);
    }

    if (store.hours) {
      const hours = document.createElement('p');
      hours.className = 'find-store-hours';
      hours.textContent = store.hours;
      body.appendChild(hours);
    }

    card.appendChild(body);
    list.appendChild(card);
  });

  block.appendChild(list);
}

function buildSearchCard(bridge) {
  const card = document.createElement('div');
  card.className = 'find-store-search';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const pinWrap = document.createElement('div');
  pinWrap.className = 'find-store-search-pin';
  pinWrap.appendChild(pinIcon(theme?.fg ?? '#fff'));
  card.appendChild(pinWrap);

  const heading = document.createElement('div');
  heading.className = 'find-store-heading';
  heading.textContent = 'Find a store near you';
  card.appendChild(heading);

  const form = document.createElement('form');
  form.className = 'find-store-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'find-store-input';
  input.placeholder = 'Enter ZIP code…';
  input.setAttribute('aria-label', 'Postal code');
  form.appendChild(input);

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'find-store-btn';
  btn.textContent = 'Search';
  btn.style.background = ACCENT;
  form.appendChild(btn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const zip = input.value.trim();
    if (bridge && zip) {
      bridge.sendMessage(`Find a Fréscopa location near ${zip}`);
    }
  });

  card.appendChild(form);
  return card;
}
