import { drag } from './drag';
import {
  findClosestItemTarget,
  findClosestTarget,
  findIntersection,
} from './utils';
import { assert } from './assert';
import { useCallback, useEffect, useRef } from 'react';

export type Dragable = {
  id: string;
  type: string;
  accept: string[];
  items?: { id: string }[];
  el: Element;
};

const createDndStore = () => {
  const dragableItems = new Map<string, Dragable & { cleanup: VoidFunction }>();
  let dragSource: Dragable | undefined;

  const handleDrag = (e: MouseEvent, source: Dragable) => {
    let target: Dragable | undefined;

    target = findIntersection(e, source, dragableItems.values());

    if (!target) {
      target = findClosestTarget(e, source, dragableItems.values());
      assert(target);
    }

    if (!target.items) {
      //todo emit onDragOver
    }
    assert(target.items);

    target = findClosestItemTarget(e, source, target.items, dragableItems);

    //todo emit onDragOver
  };

  const addDragable = (dragable: Dragable) => {
    const exists = dragableItems.get(dragable.id);
    exists?.cleanup();

    const dragAbortController = new AbortController();
    const { signal } = dragAbortController;

    dragable.el.addEventListener(
      'pointerdown',
      (e) =>
        drag(e, {
          onBeforeDragStart: () => {
            e.stopPropagation();
          },
          onDragStart: () => {
            dragSource = dragable;
          },
          onDrag: (e) => handleDrag(e, dragable),
          onDragEnd: () => {
            dragSource = undefined;
          },
        }),
      { signal },
    );

    const cleanup = () => {
      dragableItems.delete(dragable.id);
      dragAbortController.abort();
    };

    dragableItems.set(dragable.id, { ...dragable, cleanup });

    return cleanup;
  };

  const useSortable = (
    id: string,
    config: Pick<Dragable, 'type' | 'accept' | 'items'>,
  ) => {
    const cleanup = useRef(() => {});

    useEffect(
      () => () => {
        cleanup.current();
      },
      [],
    );

    return {
      isDragging: dragSource?.id === id,
      ref: useCallback(
        (el: HTMLElement | null) => {
          if (!el) return;

          cleanup.current = addDragable({
            ...config,
            el,
            id,
          });
        },
        [id, config],
      ),
    };
  };

  // todo sync with react
  return { useSortable };
};

