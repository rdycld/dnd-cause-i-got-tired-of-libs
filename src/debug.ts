import { calcDistanceBetweenRectMiddleAndPointer } from './calc-distance-between-rect-middle-and-pointer';
import type { Dragable } from './dnd-store';

export const addDebugLines = (
  event: MouseEvent,
  source: Dragable,
  targets: MapIterator<Dragable> | Dragable[],
  lines: HTMLDivElement[],
) => {
  let distance = Number.POSITIVE_INFINITY;
  let shortest;
  for (const dragable of targets) {
    if (!dragable.accept.includes(source.type)) continue;
    const rect = dragable.el.getBoundingClientRect();
    const line = document.createElement('div');

    const pointerY = event.clientY + window.scrollY;
    const pointerX = event.clientX + window.scrollX;

    const dist = calcDistanceBetweenRectMiddleAndPointer(rect, event);

    line.style.setProperty('width', dist + 'px');
    line.style.setProperty('position', 'absolute');
    line.style.setProperty('left', pointerX + 'px');
    line.style.setProperty('top', pointerY + 'px');
    line.style.setProperty('height', '1px');
    line.style.setProperty('background', 'black');
    line.style.setProperty('transform-origin', '0px 0px');
    line.dataset.length = dist.toFixed(2) + 'px';
    line.classList.add('debug-line');

    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const angle = Math.atan2(dy, dx);

    line.style.setProperty(
      'transform',
      `rotate( calc(${(angle * 180) / Math.PI}deg + 180deg) )`,
    );

    lines.push(line);

    if (dist < distance) {
      distance = dist;
      shortest = line;
    }
  }

  //todo
  // lines
  //   .sort((a, b) => {
  //     const { width: aW } = a.getBoundingClientRect();
  //     const { width: bW } = b.getBoundingClientRect();

  //     return aW - bW;
  //   })
  //   .splice(5);
  shortest?.style.setProperty('background', 'red');

  for (const l of lines) {
    document.documentElement.appendChild(l);
  }
};

