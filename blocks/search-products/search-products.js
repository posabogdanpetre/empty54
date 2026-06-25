// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Morning Muse Light Roast', description: 'A light roast with bright, citrusy notes and a smooth finish.', image_url: 'https://frescopa.coffee/media_1990fe27244fdc5d261155cd983f85a56415baf1c.jpg?width=750&format=jpg&optimize=medium', category: 'Bagged Coffee' },
  { name: 'Coffee Machines', description: 'Top-of-the-line coffee machines for brewing at home.', image_url: 'https://frescopa.coffee/media_18d90d06cb150321e2b7de19e82a9818c57b1eaaa.png?width=750&format=png&optimize=medium', category: 'Coffee Machines' },
  { name: 'Bagged Coffee', description: 'Freshly roasted whole bean and ground coffee in bags.', image_url: 'https://frescopa.coffee/media_11f2acc820929d908638cf3f7f133c5ac9792a560.png?width=750&format=png&optimize=medium', category: 'Bagged Coffee' },
  { name: 'Coffee Pods', description: 'Single-serve coffee pods for quick, convenient brewing.', image_url: 'https://frescopa.coffee/media_1611a15fc05b259399fa254f961f08b9f7804cd23.png?width=750&format=png&optimize=medium', category: 'Coffee Pods' },
  { name: 'Bundles', description: 'Curated coffee and equipment bundles.', image_url: 'https://frescopa.coffee/media_1b4036e97de71a31f998526cf47deb2999dbaee87.png?width=750&format=png&optimize=medium', category: 'Bundles' },
  { name: 'Accessories', description: 'Brewing accessories and coffee gear.', image_url: 'https://frescopa.coffee/media_1ad953e2b8b4f9e3e3f11e8fb8cedeca7a5ab2343.png?width=750&format=png&optimize=medium', category: 'Accessories' },
];

// Brand palette from BuildWidgetRequest — used to derive card info-strip background.
const PALETTE = ['#00647d', '#a33532', '#dc6e52', '#eba439', '#58181d'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
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

const CARD_COLORS = ['#00647d', '#a33532', '#dc6e52', '#eba439', '#58181d', '#0fb5ae'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderItems(block, items, bridge);

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

function renderItems(block, items, bridge) {
  const list = (items || []).slice(0, 6);

  const wrapper = document.createElement('div');
  wrapper.className = 'search-products-wrapper';

  const track = document.createElement('div');
  track.className = 'search-products-track';

  list.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'search-products-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'search-products-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.loading = 'lazy';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }
    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'search-products-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const title = document.createElement('h3');
    title.className = 'search-products-name';
    title.textContent = item.name || '';
    info.appendChild(title);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'search-products-desc';
      desc.textContent = item.description;
      info.appendChild(desc);
    }

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'search-products-badge';
      badge.textContent = item.category;
      info.appendChild(badge);
    }

    const btn = document.createElement('button');
    btn.className = 'search-products-cta';
    btn.type = 'button';
    btn.textContent = 'Shop Now';
    if (bridge) {
      btn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    info.appendChild(btn);

    card.appendChild(info);
    track.appendChild(card);
  });

  const fade = document.createElement('div');
  fade.className = 'search-products-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;

  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `search-products-arrow search-products-arrow-${dir}`;
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    b.textContent = dir === 'left' ? '◀' : '▶';
    const scroll = () => {
      const card = track.querySelector('.search-products-card');
      const amount = card ? card.offsetWidth + 16 : 236;
      track.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };
    b.addEventListener('click', scroll);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scroll(); }
    });
    return b;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    leftArrow.style.display = track.scrollLeft <= 2 ? 'none' : 'flex';
    rightArrow.style.display = track.scrollLeft >= maxScroll - 2 ? 'none' : 'flex';
  };
  track.addEventListener('scroll', updateArrows);

  wrapper.appendChild(track);
  wrapper.appendChild(fade);
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);
  block.appendChild(wrapper);

  requestAnimationFrame(updateArrows);
}
