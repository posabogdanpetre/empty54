// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: 'Morning Muse Light Roast',
  description: 'A light roast with bright, citrusy notes and a smooth finish.',
  image_url: 'https://frescopa.coffee/media_1990fe27244fdc5d261155cd983f85a56415baf1c.jpg?width=750&format=jpg&optimize=medium',
  category: 'Bagged Coffee',
};

const CARD_COLORS = ['#00647d', '#a33532', '#dc6e52', '#eba439', '#58181d'];

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA;
    } else {
      // Detail concept — structuredContent IS the item (flat). No wrapper key.
      const _result = await bridge.toolResult;
      item = (_result?.structuredContent || _result) || {};
    }
  } else {
    item = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDetail(block, item, bridge);

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

function renderDetail(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'card';

  // Image (left)
  const imageWrap = document.createElement('div');
  imageWrap.className = 'image';
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${CARD_COLORS[0]};`;
    return d;
  };
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || '';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageWrap.appendChild(img);
  } else {
    imageWrap.appendChild(colorDiv());
  }
  card.appendChild(imageWrap);

  // Content (right)
  const content = document.createElement('div');
  content.className = 'content';

  const title = document.createElement('h3');
  title.className = 'title';
  title.textContent = item.name || '';
  content.appendChild(title);

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  if (item.category) {
    const chip = document.createElement('span');
    chip.className = 'category';
    chip.textContent = item.category;
    content.appendChild(chip);
  }

  const btn = document.createElement('button');
  btn.className = 'cta';
  btn.type = 'button';
  btn.textContent = 'More Details';
  if (bridge) {
    btn.addEventListener('click', () => {
      bridge.sendMessage(`Tell me more about ${item.name}`);
    });
  }
  content.appendChild(btn);

  card.appendChild(content);
  block.appendChild(card);
}
