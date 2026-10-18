/* The illustration follows actual audio playback, including pauses and buffering. */
(() => {
  'use strict';
  const audio = document.querySelector('#playlist-audio');
  const video = document.querySelector('#gramophone-animation');
  const image = document.querySelector('img[data-art="150"]');
  if (!audio || !video || !image) return;
  const frame = image.closest('.art-crop');
  const original = new URL(video.dataset.imageSource, document.baseURI).href;
  let revision = 0;
  video.muted = true;

  function stop() {
    revision++;
    video.pause();
  }
  async function start() {
    const current = ++revision;
    if (audio.paused || audio.ended || image.src !== original) return;
    video.hidden = false;
    try {
      await video.play();
      if (current === revision && !audio.paused && image.src === original) {
        frame.classList.add('gramophone-ready');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        video.hidden = true;
        frame.classList.remove('gramophone-ready');
      }
    }
  }
  audio.addEventListener('playing', start);
  ['pause', 'waiting', 'seeking', 'emptied', 'error'].forEach(event => audio.addEventListener(event, stop));
  audio.addEventListener('seeked', () => {
    if (!audio.paused && audio.readyState >= 3) start();
  });
  audio.addEventListener('ended', () => {
    stop();
    video.currentTime = 0;
  });
  new MutationObserver(() => {
    if (image.src !== original) {
      stop();
      video.hidden = true;
      frame.classList.remove('gramophone-ready');
    } else if (!audio.paused && audio.readyState >= 3) start();
  }).observe(image, {attributes: true, attributeFilter: ['src']});
})();
