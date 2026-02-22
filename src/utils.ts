import { assert } from './assert';
import { calcDistanceBetweenRectMiddleAndPointer } from './calc-distance-between-rect-middle-and-pointer';
import type { Dragable } from './dnd-store';
import { isPointerInRect } from './is-pointer-in-rect';

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

export const handleDifferentHeights = (
  e: MouseEvent,
  source: Dragable,
  nextTarget: Dragable,
) => {
  const sourceRect = source.el.getBoundingClientRect();
  const nextTargetRect = nextTarget.el.getBoundingClientRect();

  if (sourceRect.height === nextTargetRect.height) return nextTarget;

  const top = Math.min(sourceRect.top, nextTargetRect.top);
  const threshold = top + (sourceRect.height + nextTargetRect.height) / 2;
  const isOverThreshold = e.clientY > threshold;

  const [underThresholdDragable, overThresholdDragable] =
    sourceRect.top > nextTargetRect.top
      ? [nextTarget, source]
      : [source, nextTarget];

  return isOverThreshold ? overThresholdDragable : underThresholdDragable;
};

