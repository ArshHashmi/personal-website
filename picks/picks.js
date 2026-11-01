/* My Picks: renders window.PICKS (picks/products.js) into
   data-picks="page"     the full grid with category tabs (my-picks.html)
   data-picks="preview"  the top three, featured first (home + project pages)
   Paths in the data are from the site root; they resolve against this
   script's own URL, so the same data works from any folder depth. */
(() => {
  const PICKS = window.PICKS || [];
  const base = new URL('../', document.currentScript.src);
  const PLACEHOLDER = new URL('images/picks/placeholder.svg', base).href;
  const CATS = [['tools', 'Tools'], ['car', 'Car'], ['3d printing', '3D Printing'], ['tech/gear', 'Tech/Gear']];

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
  const extLink = (cls, text, href, rel) => {
    const a = el('a', cls, text);
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
    q.append(extLink('', 'Loading the reel…', url, 'noopener'));
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
    const c = el('article', 'pick' + (p.featured ? ' is-featured' : ''));
    const reel = isUrl(p.reel) ? p.reel.trim() : '';

    const img = el('img');
    img.alt = p.name || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER; };
    img.src = p.image ? new URL(p.image, base).href : PLACEHOLDER;

    let media;
    if (reel) {
      media = el('button', 'pick-media');
      media.type = 'button';
      media.setAttribute('aria-label', `Play the ${p.name} reel`);
      media.onclick = () => openReel(reel);
      media.append(img, el('span', 'pick-play', '▶ Reel'));
    } else {
      media = el('div', 'pick-media');
      media.append(img);
    }

    const top = el('div', 'pick-top');
    if (p.brand) top.append(el('span', 'pick-brand', p.brand));
    if (p.featured) top.append(el('span', 'pick-feat', 'Top pick'));

    const btns = el('div', 'pick-btns');
    if (isUrl(p.link)) {
      btns.append(extLink('pick-btn is-primary', 'check it out', p.link.trim(), 'sponsored noopener'));
    } else {
      const soon = el('button', 'pick-btn', 'link coming soon');
      soon.type = 'button';
      soon.disabled = true;
      btns.append(soon);
    }
    if (reel) btns.append(extLink('pick-btn', 'watch the reel', reel, 'noopener'));

    const body = el('div', 'pick-body');
    body.append(top, el('h3', 'pick-name', p.name), el('p', 'pick-blurb', p.blurb), btns);
    c.append(media, body);
    return c;
  };

  const page = root => {
    const tabs = el('div', 'picks-tabs');
    tabs.setAttribute('aria-label', 'Categories');
    const grid = el('div', 'picks-grid');
    const empty = el('p', 'picks-empty', 'Nothing in this one yet. More picks are coming.');

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
  };

  const preview = root => {
    const list = sorted(PICKS).slice(0, 3);
    const sec = root.closest('.picks-sec') || root;
    if (!list.length) { sec.remove(); return; }
    const grid = el('div', 'picks-grid is-strip');
    grid.append(...list.map(card));
    root.append(grid);
  };

  document.querySelectorAll('[data-picks]').forEach(root =>
    (root.dataset.picks === 'page' ? page : preview)(root));
})();
