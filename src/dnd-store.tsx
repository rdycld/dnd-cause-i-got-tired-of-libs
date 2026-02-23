import { drag } from './drag';
import {
  findClosestItemTarget,
  findClosestTarget,
  handleDifferentDimensions,
} from './utils';
import { assert } from './assert';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
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

const dropAnimationDurationMs = 250 as const;
const varDragOverlayX = '--drag-overlay-x' as const;
const varDragOverlayY = '--drag-overlay-y' as const;
const varDragOverlayDropX = '--drag-overlay-drop-x' as const;
const varDragOverlayDropY = '--drag-overlay-drop-y' as const;

export const createDndStore = (
  withDebugLines = localStorage.getItem('debug'),
) => {
  const listeners = new Set<VoidFunction>();
  const dragableItems = new Map<string, Dragable & { cleanup: VoidFunction }>();
  const grabOffset = {
    x: 0,
    y: 0,
  };

  let state: DragState = {
    source: undefined,
    target: undefined,
  };

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

  const calcOverlayGrabOffset = (e: MouseEvent, dragable: Dragable) => {
    const { clientX, clientY } = e;
    const { left, top } = dragable.el.getBoundingClientRect();

    grabOffset.x = left - clientX;
    grabOffset.y = top - clientY;
  };

  const updateOverlay = (e: MouseEvent) => {
    document.documentElement.style.setProperty(
      varDragOverlayX,
      `${e.clientX + grabOffset.x}px`,
    );
    document.documentElement.style.setProperty(
      varDragOverlayY,
      `${e.clientY + grabOffset.y}px`,
    );
  };

  //todo
  // const cleanAfterDrop = () => {
  //   document.documentElement.style.removeProperty(varDragOverlayX);
  //   document.documentElement.style.removeProperty(varDragOverlayY);
  //   document.documentElement.style.removeProperty(varDragOverlayDropX);
  //   document.documentElement.style.removeProperty(varDragOverlayDropY);
  // };

  const dropOverlay = ({ clientX, clientY }: MouseEvent) => {
    const dragged = dragableItems.get(state.source?.id ?? '');
    if (!dragged) return;

    const { left, top } = dragged.el.getBoundingClientRect();

    const dropX = left - clientX - grabOffset.x;
    const dropY = top - clientY - grabOffset.y;

    document.documentElement.style.setProperty(
      varDragOverlayDropX,
      `${dropX}px`,
    );
    document.documentElement.style.setProperty(
      varDragOverlayDropY,
      `${dropY}px`,
    );
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
            calcOverlayGrabOffset(e, dragable);
            updateSnapshotAndEmitIfNeeded_mutable({
              source: dragable,
            });
          },
          onDrag: (e) => {
            findNextDropTarget(e, () => dragableItems.get(dragable.id));
            updateOverlay(e);
          },
          onDragEnd: (e) => {
            //! DEBUG
            if (withDebugLines)
              //@ts-expect-error its ok
              debugLines.clear();
            //! DEBUG

            dropOverlay(e);
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

  type DragOverlayProps = {
    children: (props: {
      source: Dragable | undefined;
      styles: string;
    }) => React.ReactNode;
  };
  const DragOverlay = ({ children }: DragOverlayProps) => {
    const source = useSyncExternalStore(subscribe, () => state.source);
    const [mounted, setMounted] = useState(!!source);
    const [deferredSource, setDeferredSource] = useState(source);
    const [styles, setStyles] = useState('drag-overlay');

    useEffect(() => {
      let timeoutId: number | undefined;
      if (source) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        setDeferredSource(source);
      }

      if (mounted && !source) {
        setStyles('drag-overlay drag-overlay-unmounting');

        timeoutId = window.setTimeout(() => {
          setDeferredSource(source);
          setStyles('drag-overlay');
        }, dropAnimationDurationMs);
      }
      return () => clearTimeout(timeoutId);
    }, [mounted, source]);

    return children({ source: deferredSource, styles });
  };

  return { useSortable, useMonitor, DragOverlay };
};

