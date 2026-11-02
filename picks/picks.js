/* My Picks: renders window.PICKS (picks/products.js) into data-picks="page"
   on my-picks.html, as category tabs over a grid of product cards. */
(() => {
  const PICKS = window.PICKS || [];
  const PLACEHOLDER = 'images/picks/placeholder.svg';
  const CATS = [['tools', 'Tools'], ['car', 'Car'], ['3d printing', '3D printing'], ['tech/gear', 'Tech/gear']];
  const ARROW = '<svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden="true"><path d="M1 4.5h10M8 1.5l3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const PLAY = '<svg viewBox="0 0 9 10" aria-hidden="true"><path d="M0 0l9 5-9 5z"/></svg>';

  /* Anything that isn't a real https link (an empty string, a "[reel link]"
     placeholder) counts as not there yet. */
  const isUrl = s => /^https:\/\/\S+$/.test((s || '').trim());
  const catOf = p => (p.category || '').trim().toLowerCase();
  const sorted = list => [...list].sort((a, b) => !!b.featured - !!a.featured);

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  // Label text stays textContent; only the fixed arrow is markup.
  const withArrow = (n, text) => { n.textContent = text; n.insertAdjacentHTML('beforeend', ARROW); return n; };
  const extLink = (cls, text, href, rel) => {
    const a = withArrow(el('a', cls), text);
    a.href = href; a.target = '_blank'; a.rel = rel;
    return a;
  };

  /* ── Reel pop-up: Instagram's official embed, and its script is only
     fetched the first time someone opens a reel. ── */
  let dlg, box, embedRequested = false;
  const openReel = url => {
    if (!dlg) {
      dlg = el('dialog', 'picks-dlg');
      const inner = el('div', 'picks-dlg-inner');
      const close = el('button', 'picks-dlg-close', 'Close');
      close.type = 'button';
      close.onclick = () => dlg.close();
      box = el('div', 'picks-dlg-box');
      inner.append(close, box);
      dlg.append(inner);
      // A click that lands on the dialog itself is the backdrop.
      dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
      // Emptying it on close is what stops the reel playing.
      dlg.addEventListener('close', () => box.replaceChildren());
      document.body.append(dlg);
    }
    const q = el('blockquote', 'instagram-media');
    q.dataset.instgrmPermalink = url;
    q.dataset.instgrmVersion = '14';
    const a = el('a', '', 'Loading the reel…');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    q.append(a);
    box.replaceChildren(q);
    dlg.showModal();
    if (window.instgrm) window.instgrm.Embeds.process();
    else if (!embedRequested) {
      embedRequested = true;
      const s = el('script');
      s.async = true;
      s.src = 'https://www.instagram.com/embed.js';
      document.head.append(s); // processes every embed on the page once it loads
    }
  };

  const card = p => {
    const c = el('article', 'pick');
    const reel = isUrl(p.reel) ? p.reel.trim() : '';

    const img = el('img');
    img.alt = p.name || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER; };
    img.src = p.image || PLACEHOLDER;

    let media;
    if (reel) {
      media = el('button', 'pick-media');
      media.type = 'button';
      media.setAttribute('aria-label', `Play the ${p.name} reel`);
      media.onclick = () => openReel(reel);
      const play = el('span', 'pick-play');
      play.innerHTML = PLAY;
      play.append('Reel');
      media.append(img, play);
    } else {
      media = el('div', 'pick-media');
      media.append(img);
    }
    c.append(media);

    if (p.brand) c.append(el('span', 'pick-brand', p.brand));
    const top = el('div', 'pick-top');
    top.append(el('h2', 'pick-name', p.name));
    if (p.featured) top.append(el('span', 'pick-state', 'Top pick'));
    c.append(top, el('p', 'pick-line', p.blurb));

    const links = el('div', 'pick-links');
    if (isUrl(p.link)) {
      links.append(extLink('pick-link', 'Check it out', p.link.trim(), 'sponsored noopener'));
    } else {
      const soon = el('button', 'pick-link', 'Link coming soon');
      soon.type = 'button';
      soon.disabled = true;
      links.append(soon);
    }
    if (reel) links.append(extLink('pick-link is-quiet', 'Watch the reel', reel, 'noopener'));
    c.append(links);
    return c;
  };

  const root = document.querySelector('[data-picks="page"]');
  if (!root) return;
  const tabs = el('div', 'picks-tabs');
  tabs.setAttribute('aria-label', 'Categories');
  const grid = el('div', 'picks-grid');
  const empty = el('p', 'picks-empty', 'Nothing here yet.');

  const show = cat => {
    for (const t of tabs.children) t.setAttribute('aria-pressed', t.dataset.cat === cat);
    const list = sorted(PICKS.filter(p => catOf(p) === cat));
    grid.replaceChildren(...list.map(card));
    empty.hidden = list.length > 0;
  };
  for (const [cat, label] of CATS) {
    const t = el('button', 'picks-tab', label);
    t.type = 'button';
    t.dataset.cat = cat;
    t.onclick = () => show(cat);
    tabs.append(t);
  }
  root.append(tabs, grid, empty);
  show('tools');
})();
