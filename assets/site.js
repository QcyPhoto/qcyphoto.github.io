/* Content lives in content/*.json; Pages CMS edits those files. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const labels = { home: 'Hi!', writing: '瞎写写的故事', photographs: '瞎拍拍的照片', shelf: '审美积累一下吧', about: '说点正事儿' };
  let owner = '卿晨阳';
  let song = { title: '亲密爱人', audio: 'assets/audio/anita-mui-intimate-lover-live.mp3' };
  let current = 0;
  const asText = value => typeof value === 'string' ? value : '';
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = asText(text);
    return node;
  };

  // Media must resolve to a file in this site, never executable URLs.
  function mediaURL(value) {
    if (!asText(value).trim()) return '';
    try {
      const url = new URL(value, location.href);
      return url.origin === location.origin && /^https?:$/.test(url.protocol) ? url.href : '';
    } catch { return ''; }
  }

  // The editor exports HTML. Rebuild an allowlisted document before displaying it.
  function articleHTML(value) {
    const parsed = new DOMParser().parseFromString(asText(value), 'text/html');
    const allowed = new Set(['P', 'BR', 'STRONG', 'EM', 'B', 'I', 'U', 'S', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'HR', 'PRE', 'CODE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SPAN', 'DIV']);
    const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'SVG', 'MATH', 'TEMPLATE']);
    function clean(node) {
      if (node.nodeType === 3) return document.createTextNode(node.textContent);
      if (node.nodeType !== 1 || blocked.has(node.tagName)) return document.createDocumentFragment();
      const el = allowed.has(node.tagName) ? make(node.tagName.toLowerCase()) : document.createDocumentFragment();
      if (node.tagName === 'IMG') {
        const src = mediaURL(node.getAttribute('src'));
        if (!src) return document.createDocumentFragment();
        el.src = src; el.alt = node.getAttribute('alt') || ''; el.loading = 'lazy'; el.className = 'report-photo';
      }
      if (node.tagName === 'A') {
        try {
          const url = new URL(node.getAttribute('href') || '', location.href);
          if (/^https?:$/.test(url.protocol)) { el.href = url.href; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
        } catch { /* Keep link text without an unsafe destination. */ }
      }
      if (node.classList.contains('caption')) el.className = 'caption';
      for (const child of node.childNodes) el.append(clean(child));
      return el;
    }
    const result = document.createDocumentFragment();
    for (const child of parsed.body.childNodes) result.append(clean(child));
    return result;
  }

  function route() {
    let id = location.hash.slice(1) || 'home';
    if (id === 'main') { $('#main').focus(); return; }
    if (!Object.hasOwn(labels, id)) id = 'home';
    $$('main > section').forEach(p => { p.hidden = p.id !== id; });
    $$('[data-page]').forEach(a => {
      if (a.dataset.page === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = labels[id] + ' · ' + owner;
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', route);
  route();

  function openDialog(dialog) {
    dialog.showModal(); document.body.style.overflow = 'hidden'; dialog.scrollTop = 0;
  }
  function bindDialog(dialog) {
    $('[data-close]', dialog).onclick = () => dialog.close();
    dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
    dialog.addEventListener('click', e => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
  }
  $$('dialog').forEach(bindDialog);
  // Original articles remain usable when a content file cannot be loaded.
  $('#open-essay').onclick = () => openDialog($('#essay-dialog'));
  $('#open-report').onclick = () => openDialog($('#report-dialog'));
  const storyDialog = make('dialog');
  storyDialog.id = 'story-dialog'; storyDialog.setAttribute('aria-labelledby', 'cms-article-title');
  const bar = make('div', 'modalbar');
  const category = make('span');
  const close = make('button', 'close', '关闭 ×'); close.dataset.close = '';
  bar.append(category, close);
  const article = make('article', 'article');
  storyDialog.append(bar, article); document.body.append(storyDialog); bindDialog(storyDialog);
  function openStory(story) {
    category.textContent = asText(story.category);
    const title = make('h2', '', story.title); title.id = 'cms-article-title';
    article.replaceChildren(title);
    if (story.meta) article.append(make('p', 'meta', story.meta));
    article.append(articleHTML(story.body));
    openDialog(storyDialog);
  }
  function renderStories(data) {
    if (!Array.isArray(data.items)) throw new Error('Invalid stories');
    const list = $('.story-list'), fragment = document.createDocumentFragment();
    for (const story of data.items) {
      if (!story || typeof story.title !== 'string') continue;
      const button = make('button', 'story'); button.type = 'button';
      button.append(make('small', '', story.category), make('h3', '', story.title), make('p', '', story.excerpt), make('span', 'read', '读一读 ↗'));
      button.onclick = () => openStory(story);
      fragment.append(button);
    }
    if (!fragment.childNodes.length) fragment.append(make('p', 'empty-content', '故事还在路上。'));
    list.replaceChildren(fragment);
    $('#essay-dialog').remove(); $('#report-dialog').remove();
  }

  const gallery = $('.gallery'), box = $('#lightbox');
  const photoImages = () => $$('[data-photo] img', gallery);
  function showPhoto(i) {
    const photos = photoImages(); if (!photos.length) return;
    current = (i + photos.length) % photos.length;
    const photo = photos[current];
    $('#large-photo').src = photo.src; $('#large-photo').alt = photo.alt;
    $('#photo-caption').textContent = photo.alt;
    $('#photo-index').textContent = `${current + 1} / ${photos.length}`;
  }
  gallery.addEventListener('click', e => {
    const button = e.target.closest('[data-photo]'); if (!button) return;
    const index = photoImages().indexOf($('img', button));
    if (index < 0) return;
    showPhoto(index); openDialog(box);
  });
  $('#prev').onclick = () => showPhoto(current - 1);
  $('#next').onclick = () => showPhoto(current + 1);
  const scrollPhotos = direction => gallery.scrollBy({left: direction * gallery.clientWidth * .7, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  $('#gallery-prev').onclick = () => scrollPhotos(-1);
  $('#gallery-next').onclick = () => scrollPhotos(1);
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); showPhoto(current + (e.key === 'ArrowLeft' ? -1 : 1)); }
  });
  function renderPhotos(data) {
    if (!Array.isArray(data.items)) throw new Error('Invalid photographs');
    const fragment = document.createDocumentFragment();
    for (const photo of data.items) {
      const src = mediaURL(photo?.image); if (!src) continue;
      const index = fragment.childNodes.length + 1;
      const button = make('button', 'photo'); button.type = 'button'; button.dataset.photo = '';
      button.setAttribute('aria-label', `放大照片 ${index}：${asText(photo.caption)}`);
      const img = make('img'); img.src = src; img.alt = asText(photo.caption); img.loading = 'lazy';
      button.append(img, make('span', '', String(index).padStart(2, '0'))); fragment.append(button);
    }
    const empty = fragment.childNodes.length === 0;
    if (empty) fragment.append(make('p', 'empty-content', '照片还在路上。'));
    gallery.replaceChildren(fragment); gallery.scrollLeft = 0;
    $('#gallery-prev').disabled = empty; $('#gallery-next').disabled = empty;
  }

  const audio = $('#playlist-audio'), player = $('#playlist-button'), status = $('#playlist-status');
  const musicToggle = $('#music-toggle'), progress = $('#music-progress');
  function formatTime(value) {
    const seconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function updateProgress() {
    const ready = Number.isFinite(audio.duration) && audio.duration > 0;
    const fraction = ready ? Math.min(1, Math.max(0, audio.currentTime / audio.duration)) : 0;
    progress.disabled = !ready;
    progress.value = String(Math.round(fraction * 1000));
    progress.closest('.music-seek').style.setProperty('--remaining', String(100 - fraction * 100));
    progress.setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`);
    $('#music-current').textContent = formatTime(audio.currentTime);
    $('#music-duration').textContent = formatTime(audio.duration);
  }
  function playerState() {
    const playing = !audio.paused && !audio.ended;
    for (const button of [player, musicToggle]) {
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', (playing ? '暂停《' : '播放《') + song.title + '》');
    }
    $('[data-music-icon="play"]').toggleAttribute('hidden', playing);
    $('[data-music-icon="pause"]').toggleAttribute('hidden', !playing);
    $('#music-title').textContent = song.title;
    $('#music-artist').textContent = song.artist || '';
    $('#playlist-hint').textContent = song.title;
    if (song.artist) player.title = song.title + ' · ' + song.artist;
  }
  function renderMusic(data) {
    song = {title: asText(data.title) || '音乐', artist: asText(data.artist), audio: mediaURL(data.audio)};
    audio.pause();
    if (song.audio) audio.src = song.audio;
    else audio.removeAttribute('src');
    status.hidden = true;
    if (typeof data.caption === 'string') $('.dream').textContent = data.caption;
    playerState();
    updateProgress();
  }
  renderMusic(song);
  async function toggleMusic() {
    if (!song.audio) { status.hidden = false; status.textContent = '歌单准备中，稍后就能听到。'; return; }
    if (!audio.paused) { audio.pause(); return; }
    try { await audio.play(); status.hidden = true; }
    catch { status.hidden = false; status.textContent = '暂时无法播放，请稍后再试。'; }
  }
  player.addEventListener('click', toggleMusic);
  musicToggle.addEventListener('click', toggleMusic);
  progress.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Number(progress.value) / 1000 * audio.duration;
      updateProgress();
    }
  });
  ['play', 'pause', 'ended'].forEach(type => audio.addEventListener(type, playerState));
  ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked', 'emptied'].forEach(type => audio.addEventListener(type, updateProgress));
  audio.addEventListener('error', () => { status.hidden = false; status.textContent = '歌曲暂时无法加载，请稍后再试。'; });

  function renderHome(data) {
    if (asText(data.name)) { owner = data.name; $('.name').textContent = owner; }
    if (typeof data.greeting === 'string') {
      const title = $('#home-title');
      // Keep the uploaded handwriting when the CMS greeting matches it.
      if (data.greeting !== title.dataset.handwrittenText) {
        title.textContent = data.greeting;
        title.removeAttribute('aria-label');
      }
    }
    if (typeof data.signature === 'string') $('.hello p').textContent = data.signature;
    route();
  }
  function renderResume(data) {
    $$('.resume-row').forEach((row, i) => {
      const src = mediaURL(data[i === 0 ? 'chinese' : 'english']);
      if (!src) return;
      $$('a', row).forEach(a => { a.href = src; if (a.hasAttribute('download')) a.setAttribute('download', i === 0 ? owner + '-中文简历.pdf' : 'Resume-EN.pdf'); });
    });
  }
  // Keep the original hand-cropped composition until a different image is selected.
  const artSlots = {
    cover: '143', photo_character: '144', photo_icon: '145',
    story_character: '146', story_icon: '147', taste_icon: '148',
    bookshelf: '149', gramophone: '150'
  };
  const originalArt = new Map(Object.entries(artSlots).map(([key, id]) => {
    const image = $(`img[data-art="${id}"]`);
    return [key, {image, url: image.src, alt: image.alt, style: image.getAttribute('style') || ''}];
  }));
  // Measure only the ink, leaving the uploaded file itself unchanged.
  function inkBounds(pixels, width, height) {
    let left = width, top = height, right = -1, bottom = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const darkness = (255 - Math.min(pixels[i], pixels[i + 1], pixels[i + 2])) * pixels[i + 3] / 255;
        if (darkness <= 12) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    if (right < left) return null;
    const pad = Math.max(2, Math.ceil(Math.max(right - left + 1, bottom - top + 1) * .025));
    left = Math.max(0, left - pad); top = Math.max(0, top - pad);
    right = Math.min(width - 1, right + pad); bottom = Math.min(height - 1, bottom + pad);
    return {x: left, y: top, width: right - left + 1, height: bottom - top + 1};
  }
  function drawingPlacement(bounds, width, height, frameRatio) {
    const inkRatio = bounds.width / bounds.height;
    const displayWidth = Math.min(1, inkRatio / frameRatio);
    const displayHeight = displayWidth * frameRatio / inkRatio;
    return {
      width: 100 * displayWidth * width / bounds.width,
      left: 100 * ((1 - displayWidth) / 2 - bounds.x / bounds.width * displayWidth),
      top: 100 * ((1 - displayHeight) / 2 - bounds.y / bounds.height * displayHeight)
    };
  }
  function fitDrawing(image, frame) {
    if (!image.naturalWidth || !image.naturalHeight) return;
    try {
      const scale = Math.min(1, 768 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext('2d', {willReadFrequently: true});
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const bounds = inkBounds(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if (!bounds) return;
      // Each drawing keeps its original layout frame, including on hidden pages.
      const parts = frame.style.aspectRatio.split('/').map(Number);
      const ratio = parts.length === 2 ? parts[0] / parts[1] : parts[0];
      if (!(ratio > 0)) return;
      const place = drawingPlacement(bounds, canvas.width, canvas.height, ratio);
      frame.classList.remove('art-fit');
      image.style.width = place.width + '%';
      image.style.height = 'auto';
      image.style.left = place.left + '%';
      image.style.top = place.top + '%';
      image.style.maxWidth = 'none';
    } catch { /* Keep full-image display if pixel inspection is unavailable. */ }
  }
  function renderIllustrations(data) {
    if (!data || typeof data !== 'object') return;
    for (const [key, original] of originalArt) {
      const settings = data[key];
      const url = mediaURL(settings?.image);
      if (!url) continue;
      const image = original.image;
      const frame = image.closest('.art-crop');
      function restore() {
        image.onerror = null; image.onload = null;
        frame.classList.remove('art-fit');
        image.setAttribute('style', original.style);
        image.src = original.url;
        image.alt = original.alt;
      }
      if (url === original.url) {
        restore();
        if (typeof settings.alt === 'string') image.alt = settings.alt;
        continue;
      }
      image.onerror = restore;
      image.onload = () => fitDrawing(image, frame);
      frame.classList.add('art-fit');
      image.removeAttribute('style');
      if (typeof settings.alt === 'string') image.alt = settings.alt;
      image.src = url;
      if (image.complete && image.naturalWidth) fitDrawing(image, frame);
    }
    $$('.book-link').forEach(link => { link.hidden = data.show_book_names === false; });
  }

  // Each section updates independently; an unavailable JSON file retains its static fallback.
  const renderers = {home: renderHome, photos: renderPhotos, stories: renderStories, music: renderMusic, resume: renderResume, illustrations: renderIllustrations};
  Promise.allSettled(Object.entries(renderers).map(async ([name, render]) => {
    const response = await fetch(`content/${name}.json`, {cache: 'no-cache'});
    if (!response.ok) throw new Error(`Content unavailable: ${name}`);
    render(await response.json());
  })).then(results => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') console.warn('Using saved page content:', Object.keys(renderers)[index]);
    });
  });
})();
