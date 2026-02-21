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

type DnDCtx = {
  addDragable(dragable: Dragable): () => void;
  removeDragable(dragable: Dragable): void;
  draggingId: string | undefined;
};

const dndContext = createContext<DnDCtx | null>(null);

export type Dragable = {
  id: string;
  type: string;
  accept: string[];
  priority: number;
  items?: { id: string }[];
  el: Element;
};

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

      const f = (e: Event) => {
        e.stopPropagation();

        return drag(e, {
          onDragStart: () => setDraggingId(dragable.id),
          onDrag: (e) => handleOnDrag(e, dragable),
          onDragEnd: () => setDraggingId(undefined),
        });
      };
      dragable.el.addEventListener('pointerdown', f);

      const cleanup = () => {
        dragables.current.delete(dragable.id);
        dragable.el.removeEventListener('pointerdown', f);
      };

      dragables.current.set(dragable.id, { ...dragable, cleanup });

      return cleanup;
    },
    [handleOnDrag],
  );

  const removeDragable = useCallback((dragable: Dragable) => {
    if (typeof dragable === 'string') {
      dragables.current.delete(dragable);
    } else {
      dragables.current.delete(dragable.id);
    }
  }, []);

  return (
    <dndContext.Provider
      value={useMemo(
        () => ({ addDragable, removeDragable, draggingId }),
        [addDragable, draggingId, removeDragable],
      )}
    >
      {props.children}
    </dndContext.Provider>
  );
};

export const useDndContext = () => {
  const ctx = useContext(dndContext);
  if (!ctx) throw new Error('xxx');

  return ctx;
};

