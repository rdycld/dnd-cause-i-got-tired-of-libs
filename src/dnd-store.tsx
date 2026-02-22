import { drag } from './drag';
import {
  findClosestItemTarget,
  findClosestTarget,
  handleDifferentDimensions,
} from './utils';
import { assert } from './assert';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { addDebugLines } from './debug';

export type Dragable = {
  id: string;
  type: 'parent' | 'child';
  accept: ('parent' | 'child')[];
  items?: { id: string }[];
  el: HTMLElement;
};

type DragState = {
  source: Dragable | undefined;
  target: Dragable | undefined;
};

export const createDndStore = (
  withDebugLines = localStorage.getItem('debug'),
) => {
  const listeners = new Set<VoidFunction>();
  const dragableItems = new Map<string, Dragable & { cleanup: VoidFunction }>();

  //! DEBUG
  const debugLines: HTMLDivElement[] = [];
  //@ts-expect-error its ok
  debugLines.clear = function () {
    for (const l of this) {
      l.remove();
    }
    this.length = 0;
  };
  //! DEBUG

  let state: DragState = {
    source: undefined,
    target: undefined,
  };

  const updateSnapshotAndEmitIfNeeded_mutable = (
    newState: Partial<DragState>,
  ) => {
    let same = true;

    for (const [k, v] of Object.entries(newState)) {
      if (!Object.hasOwn(state, k)) {
        console.error('keys are bad');
        break;
      }
      //@ts-expect-error its ok, we checked above
      same = Object.is(v, state[k]);

      if (!same) break;
    }

    if (!same) {
      state = { ...state, ...newState };
      emit();
    }
  };

  const getSnapshot = () => {
    return state;
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

  const findNextDropTarget = (
    e: MouseEvent,
    getSource: () => Dragable | undefined,
  ) => {
    const source = getSource();

    if (!source) return;

    //! DEBUG
    if (withDebugLines) {
      //@ts-expect-error its ok
      debugLines.clear();
      addDebugLines(e, source, dragableItems.values(), debugLines);
    }
    //! DEBUG

    let nextTarget = findClosestTarget(e, source, dragableItems.values());
    assert(nextTarget);

    if (!nextTarget.items) {
      nextTarget = handleDifferentDimensions(e, source, nextTarget);
      updateSnapshotAndEmitIfNeeded_mutable({ target: nextTarget });
      return;
    }

    if (
      !nextTarget.items.find((el) => el.id === source.id) &&
      source.type === 'child'
    ) {
      updateSnapshotAndEmitIfNeeded_mutable({
        target: nextTarget,
      });
      return;
    }

    const itemTarget = findClosestItemTarget(
      e,
      source,
      nextTarget.items,
      dragableItems,
    );

    if (itemTarget) {
      nextTarget = itemTarget;
    }

    nextTarget = handleDifferentDimensions(e, source, nextTarget);
    updateSnapshotAndEmitIfNeeded_mutable({
      target: nextTarget,
    });
  };

  const putDragable = (dragable: Dragable) => {
    let cleaned = false;

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
            updateSnapshotAndEmitIfNeeded_mutable({
              source: dragable,
            });
          },
          onDrag: (e) =>
            findNextDropTarget(e, () => dragableItems.get(dragable.id)),
          onDragEnd: () => {
            //! DEBUG
            if (withDebugLines)
              //@ts-expect-error its ok
              debugLines.clear();
            //! DEBUG

            updateSnapshotAndEmitIfNeeded_mutable({
              source: undefined,
              target: undefined,
            });
          },
        }),
      { signal },
    );

    const cleanup = () => {
      if (!cleaned) {
        dragableItems.delete(dragable.id);
        dragAbortController.abort();
      }
      cleaned = true;
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
      () => getSnapshot().source?.id === id,
    );

    const cleanup = useRef(() => {});
    useEffect(() => () => cleanup.current(), []);

    return {
      isDragging,
      ref: useCallback(
        (el: HTMLElement | null) => {
          cleanup.current();

          if (!el) return;

          cleanup.current = putDragable({ ...config, el, id });
        },
        [id, config],
      ),
    };
  };

  return { useSortable, useMonitor };
};

