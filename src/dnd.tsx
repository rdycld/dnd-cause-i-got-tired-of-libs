import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
  useState,
} from 'react';

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

const isPointerInRect = (
  rect: DOMRect,
  { clientX, clientY }: { clientX: number; clientY: number },
) => {
  let isInside = true;

  if (clientX < rect.left || clientX > rect.right) isInside = false;
  if (clientY > rect.bottom || clientY < rect.top) isInside = false;

  return isInside;
};

const calcDistBetweenRectMiddleAndPointer = (
  rect: DOMRect,
  { clientX, clientY }: { clientX: number; clientY: number },
) => {
  const rectMiddleX = rect.left + rect.width / 2;
  const rectMiddleY = rect.top + rect.height / 2;

  return ((rectMiddleX - clientX) ** 2 + (rectMiddleY - clientY) ** 2) ** 0.5;
};

export const DnDProvider = (props: {
  children: React.ReactNode;
  onDragOver: (arg: any) => void;
}) => {
  const dragables = useRef(
    new Map<string, Dragable & { cleanup: VoidFunction }>(),
  );
  const [draggingId, setDraggingId] = useState<string>();

  const drag = useCallback(
    (e: Event, source: Dragable) => {
      if (!(e.currentTarget instanceof Element) || !e.currentTarget) return;

      let dragging = false;
      let cleaned = false;

      const style = document.createElement('style');
      style.innerHTML = `* { cursor:grabbing !important}`;
      document.head.appendChild(style);

      document.documentElement.addEventListener('pointermove', onDragOver);
      document.documentElement.addEventListener('pointerup', onDragEnd);
      setDraggingId(source.id);

      function onDragOver(event: MouseEvent) {
        event.preventDefault();
        if (!dragging) {
          dragging = true;
        }

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

            const dist = calcDistBetweenRectMiddleAndPointer(
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
            const dist = calcDistBetweenRectMiddleAndPointer(
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
      }

      function onDragEnd() {
        clean();
      }

      function clean() {
        if (cleaned) {
          return;
        }
        cleaned = true;
        style.remove();
        setDraggingId(undefined);

        if (dragging) {
          dragging = false;
        }

        document.documentElement.removeEventListener('pointermove', onDragOver);
        document.documentElement.removeEventListener('pointerup', onDragEnd);
      }
    },
    [props],
  );

  const addDragable = useCallback(
    (dragable: Dragable) => {
      const exists = dragables.current.get(dragable.id);
      exists?.cleanup();

      const f = (e: Event) => {
        e.stopPropagation();

        return drag(e, dragable);
      };
      dragable.el.addEventListener('pointerdown', f);

      const cleanup = () => {
        dragables.current.delete(dragable.id);
        dragable.el.removeEventListener('pointerdown', f);
      };

      dragables.current.set(dragable.id, { ...dragable, cleanup });

      return cleanup;
    },
    [drag],
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

