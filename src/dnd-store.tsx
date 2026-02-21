import { drag } from './drag';
import {
  findClosestItemTarget,
  findClosestTarget,
  findIntersection,
} from './utils';
import { assert } from './assert';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

export type Dragable = {
  id: string;
  type: string;
  accept: string[];
  items?: { id: string }[];
  el: Element;
};

export const createDndStore = () => {
  const listeners = new Set<VoidFunction>();
  const dragableItems = new Map<string, Dragable & { cleanup: VoidFunction }>();

  const snapshot: {
    dragSource: Dragable | undefined;
    target: Dragable | undefined;
  } = {
    dragSource: undefined,
    target: undefined,
  };

  const getSnapshot = () => {
    return snapshot;
  };

  const emit = () => {
    for (const l of listeners) {
      l();
    }
  };

  const subscribe = (listener: VoidFunction) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const handleDrag = (e: MouseEvent, source: Dragable) => {
    snapshot.target = findIntersection(e, source, dragableItems.values());

    if (!snapshot.target) {
      snapshot.target = findClosestTarget(e, source, dragableItems.values());
      assert(snapshot.target);
    }

    if (!snapshot.target.items) {
      emit();
      return;
    }

    assert(snapshot.target.items);

    const itemTarget = findClosestItemTarget(
      e,
      source,
      snapshot.target.items,
      dragableItems,
    );

    if (itemTarget) {
      snapshot.target = itemTarget;
    }

    emit();
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
            snapshot.dragSource = dragable;
            emit();
          },
          onDrag: (e) => handleDrag(e, dragable),
          onDragEnd: () => {
            snapshot.dragSource = undefined;
            snapshot.target = undefined;
            emit();
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

  const useMonitor = (
    onChange: (state: {
      dragSource: Dragable | undefined;
      target: Dragable | undefined;
    }) => void,
  ) => {
    const lastSnapshot = useRef({ ...getSnapshot() });

    useSyncExternalStore(
      (onStoreChange) => {
        const f = () => {
          const prev = lastSnapshot.current;
          const next = getSnapshot();

          if (
            prev.dragSource?.id !== next.dragSource?.id ||
            prev.target?.id !== next.target?.id
          ) {
            lastSnapshot.current = { ...next };
            onStoreChange();
            onChange(lastSnapshot.current);
          }
        };

        const unsb = subscribe(f);
        return () => {
          unsb();
        };
      },
      () => lastSnapshot.current,
    );
  };

  const useSortable = (
    id: string,
    config: Pick<Dragable, 'type' | 'accept' | 'items'>,
  ) => {
    const isDragging = useSyncExternalStore(
      subscribe,
      () => getSnapshot().dragSource?.id === id,
    );

    const cleanup = useRef(() => {});
    useEffect(() => () => cleanup.current(), []);

    return {
      isDragging,
      ref: useCallback(
        (el: HTMLElement | null) => {
          cleanup.current();
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

  return { useSortable, useMonitor };
};

