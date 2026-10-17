/* Animate separate regions of the original handwriting, preserving every stroke. */
(() => {
  'use strict';
  const frame = document.querySelector('.greeting-art');
  const image = frame?.querySelector('img');
  if (!image) return;

  async function prepare() {
    try { await image.decode(); }
    catch { return; }
    if (!image.isConnected || frame.querySelector('svg')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '289 446 2008 480');
    svg.setAttribute('class', 'greeting-drop');
    svg.setAttribute('aria-hidden', 'true');
    // H, i, comma, 我, 是, 卿, 晨, 阳. Cuts fall in the gaps between strokes.
    const edges = [289, 610, 770, 900, 1180, 1470, 1785, 2015, 2297];
    svg.innerHTML = `<defs>
      <image id="handwriting-source" width="2388" height="1668"/>
      ${edges.slice(0, -1).map((x, i) => `<clipPath id="handwriting-${i}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="446" width="${edges[i + 1] - x}" height="480"/></clipPath>`).join('')}
    </defs>${edges.slice(0, -1).map((_, i) => `<g class="greeting-letter" style="--letter:${i}"><g clip-path="url(#handwriting-${i})"><use href="#handwriting-source"/></g></g>`).join('')}`;
    svg.querySelector('image').setAttribute('href', image.src);
    frame.append(svg);
    frame.classList.add('greeting-animated');
  }
  prepare();
})();
