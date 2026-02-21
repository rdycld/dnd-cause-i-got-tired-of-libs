import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { isPointerInRect } from './is-pointer-in-rect';
import { calcDistanceBetweenRectMiddleAndPointer } from './calc-distance-between-rect-middle-and-pointer';
import { drag } from './drag';

export type Dragable = {
  id: string;
  type: string;
  accept: string[];
  priority: number;
  items?: { id: string }[];
  el: Element;
};

const createDndStore = () => {
  const dragableItems = new Map<string, Dragable & { cleanup: VoidFunction }>();
  let dragSource: Dragable | undefined;

  const handleDrag = (e: MouseEvent, source: Dragable) => {
    let target: Dragable | undefined;
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

  // todo sync with react
  return {
    addDragable,
    dragSource,
  };
};

//  react context <puke>
type DnDCtx = {
  addDragable(dragable: Dragable): () => void;
  draggingId: string | undefined;
};

const dndContext = createContext<DnDCtx | null>(null);

export const DnDProvider = (props: {
  children: React.ReactNode;
  onDragOver: (arg: any) => void;
}) => {
  const dragables = useRef(
    new Map<string, Dragable & { cleanup: VoidFunction }>(),
  );
  const [draggingId, setDraggingId] = useState<string>();

  const handleOnDrag = useCallback(
    (event: MouseEvent, source: Dragable) => {
      let target: Dragable | undefined;

      // find intersections
      for (const dragable of dragables.current.values()) {
        if (!dragable.accept.includes(source.type)) continue;

        if (isPointerInRect(dragable.el.getBoundingClientRect(), event)) {
          target = dragable;
          break;
        }
      }

      // find closest slot
      if (!target) {
        let distance = Number.POSITIVE_INFINITY;

        for (const dragable of dragables.current.values()) {
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
      }

      if (!target) return;

      if (!target.items) {
        props.onDragOver({ source, target });
        return;
      }

      let distance = Number.POSITIVE_INFINITY;
      for (const { id } of target.items) {
        const item = dragables.current.get(id);

        if (!item) continue;
        if (!item.accept.includes(source.type)) continue;

        if (isPointerInRect(item.el.getBoundingClientRect(), event)) {
          target = item;
          break;
        } else {
          const dist = calcDistanceBetweenRectMiddleAndPointer(
            item.el.getBoundingClientRect(),
            event,
          );

          if (dist < distance) {
            target = item;
            distance = dist;
          }
        }
      }

      props.onDragOver({ source, target });
    },
    [props],
  );

  const addDragable = useCallback(
    (dragable: Dragable) => {
      const exists = dragables.current.get(dragable.id);
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
              setDraggingId(dragable.id);
            },
            onDrag: (ev) => handleOnDrag(ev, dragable),
            onDragEnd: () => setDraggingId(undefined),
          }),
        { signal },
      );

      const cleanup = () => {
        dragables.current.delete(dragable.id);
        dragAbortController.abort();
      };

      dragables.current.set(dragable.id, { ...dragable, cleanup });

      return cleanup;
    },
    [handleOnDrag],
  );

  return (
    <dndContext.Provider
      value={useMemo(
        () => ({ addDragable, draggingId }),
        [addDragable, draggingId],
      )}
    >
      {props.children}
    </dndContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDndContext = () => {
  const ctx = useContext(dndContext);
  if (!ctx) throw new Error('xxx');

  return ctx;
};

