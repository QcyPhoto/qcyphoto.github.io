/* A muted video gives the uploaded animation reliable replay and end events. */
(() => {
  'use strict';
  const frame = document.querySelector('.cover-art .art-crop');
  const image = frame?.querySelector('img');
  const video = frame?.querySelector('[data-home-animation]');
  if (!image || !video) return;

  const source = video.dataset.imageSource
    ? new URL(video.dataset.imageSource, document.baseURI).href
    : image.src;
  let enabled = false;
  let hovering = false;
  let focused = false;
  video.muted = true;

  function play(restart = false) {
    if (!enabled) return;
    video.loop = hovering || focused;
    if (restart) video.currentTime = 0;
    video.play().catch(() => {
      // Leave the original GIF visible if video playback is unavailable.
      frame.classList.remove('home-animation-ready');
    });
  }

  function syncSource() {
    const matches = image.src === source;
    if (matches === enabled) return;
    enabled = matches;
    video.hidden = !enabled;
    if (enabled) play(true);
    else {
      video.pause();
      video.loop = false;
      frame.classList.remove('home-animation-ready');
    }
  }

  video.addEventListener('playing', () => {
    if (enabled) frame.classList.add('home-animation-ready');
  });
  video.addEventListener('error', () => {
    frame.classList.remove('home-animation-ready');
    video.hidden = true;
  });
  frame.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovering = true;
    play(true);
  });
  frame.addEventListener('pointerleave', () => {
    hovering = false;
    video.loop = enabled && focused;
  });
  video.addEventListener('focus', () => {
    focused = true;
    play(true);
  });
  video.addEventListener('blur', () => {
    focused = false;
    video.loop = enabled && hovering;
  });
  // Pages CMS can replace the cover: do not cover a new image with this video.
  new MutationObserver(syncSource).observe(image, {attributes: true, attributeFilter: ['src']});
  syncSource();
})();
