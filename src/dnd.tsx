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
  removeDragable(dragable: Dragable | string): void;
  draggingId: string | undefined;
};

const dndContext = createContext<DnDCtx | null>(null);

export type Dragable = {
  id: string;
  type: string;
  accept: string[];
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

      document.documentElement.addEventListener('dragover', onDragOver);
      document.documentElement.addEventListener('dragend', onDragEnd);
      setDraggingId(source.id);

      function onDragOver(event: DragEvent) {
        event.preventDefault();
        if (!dragging) {
          dragging = true;
        }

        let target = source;
        let intersectionFound = false;

        // find intersections
        for (const dragable of dragables.current.values()) {
          const isPointerInside = isPointerInRect(
            dragable.el.getBoundingClientRect(),
            event,
          );

          if (isPointerInside) {
            intersectionFound = true;
            target = dragable;
          }
        }

        // find closest slot
        if (!intersectionFound) {
          let distance = Number.POSITIVE_INFINITY;

          for (const dragable of dragables.current.values()) {
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

        if (target !== source) props.onDragOver({ source, target });
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

        document.documentElement.removeEventListener('dragover', onDragOver);
        document.documentElement.removeEventListener('dragend', onDragEnd);
      }
    },
    [props],
  );

  const addDragable = useCallback(
    (dragable: Dragable) => {
      const exists = dragables.current.get(dragable.id);
      exists?.cleanup();

      const f = (e: Event) => {
        return drag(e, dragable);
      };
      dragable.el.addEventListener('dragstart', f);

      const cleanup = () => {
        dragables.current.delete(dragable.id);
        dragable.el.removeEventListener('dragstart', f);
      };

      dragables.current.set(dragable.id, { ...dragable, cleanup });

      return cleanup;
    },
    [drag],
  );

  const removeDragable = useCallback((dragable: Dragable | string) => {
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

