import { drag } from './drag';
import { findClosestItemTarget, findClosestTarget } from './utils';
import { assert } from './assert';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

export type Dragable = {
  id: string;
  type: string;
  accept: string[];
  items?: { id: string }[];
  el: Element;
};

type DragState = {
  dragSource: Dragable | undefined;
  target: Dragable | undefined;
};

export const createDndStore = () => {
  const listeners = new Set<VoidFunction>();
  const dragableItems = new Map<string, Dragable & { cleanup: VoidFunction }>();

  let snapshot: DragState = {
    dragSource: undefined,
    target: undefined,
  };

  const updateSnapshotAndEmitIfNeeded_mutable = (
    newState: Partial<DragState>,
  ) => {
    let same = true;

    for (const [k, v] of Object.entries(newState)) {
      same = Object.is(v, snapshot[k]);

      if (!same) break;
    }

    if (!same) {
      snapshot = { ...snapshot, ...newState };
      emit();
    }
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
    let nextTarget = findClosestTarget(e, source, dragableItems.values());
    assert(nextTarget);

    if (!nextTarget.items) {
      updateSnapshotAndEmitIfNeeded_mutable({ target: nextTarget });
      return;
    }

    assert(nextTarget.items);

    const itemTarget = findClosestItemTarget(
      e,
      source,
      nextTarget.items,
      dragableItems,
    );

    if (itemTarget) {
      nextTarget = itemTarget;
    }
    updateSnapshotAndEmitIfNeeded_mutable({ target: nextTarget });
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

  const useMonitor = (onChange: (dragState: DragState) => void) => {
    const state = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
      onChange(state);
    }, [state, onChange]);
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

