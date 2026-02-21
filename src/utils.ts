import { assert } from './assert';
import { calcDistanceBetweenRectMiddleAndPointer } from './calc-distance-between-rect-middle-and-pointer';
import type { Dragable } from './dnd-store';
import { isPointerInRect } from './is-pointer-in-rect';

/**
 *
 * @param event
 * @param source
 * @param targets
 * @returns
 */
export const findIntersection = (
  event: MouseEvent,
  source: Dragable,
  targets: MapIterator<Dragable>,
) => {
  let intersection: Dragable | undefined;

  for (const target of targets) {
    if (!target.accept.includes(source.type)) continue;

    if (isPointerInRect(target.el.getBoundingClientRect(), event)) {
      intersection = target;
      break;
    }
  }

  return intersection;
};

export const findClosestTarget = (
  event: MouseEvent,
  source: Dragable,
  targets: MapIterator<Dragable> | Dragable[],
) => {
  let target;
  let distance = Number.POSITIVE_INFINITY;

  for (const dragable of targets) {
    if (!dragable.accept.includes(source.type)) continue;

    const dist = calcDistanceBetweenRectMiddleAndPointer(
      dragable.el.getBoundingClientRect(),
      event,
    );

    if (dist < distance) {
      target = dragable;
      distance = dist;
    }
  }

  assert(target);

  return target;
};

export const findClosestItemTarget = (
  e: MouseEvent,
  source: Dragable,
  items: { id: string }[],
  dragableItems: Map<string, Dragable>,
) => {
  let target: Dragable | undefined;
  let distance = Number.POSITIVE_INFINITY;

  for (const { id } of items) {
    const item = dragableItems.get(id);
    if (!item) continue;
    if (!item.accept.includes(source.type)) continue;

    if (isPointerInRect(item.el.getBoundingClientRect(), e)) {
      target = item;
      break;
    } else {
      const dist = calcDistanceBetweenRectMiddleAndPointer(
        item.el.getBoundingClientRect(),
        e,
      );

      if (dist < distance) {
        target = item;
        distance = dist;
      }
    }
  }

  return target;
};

