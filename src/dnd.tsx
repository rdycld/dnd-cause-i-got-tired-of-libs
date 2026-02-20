import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

function assert(condition: unknown): asserts condition {
  if (!condition) throw new Error();
}

type DnDCtx = {
  addDragable(dragable: Dragable): () => void;
  removeDragable(dragable: Dragable | string): void;
};

const dndContext = createContext<DnDCtx | null>(null);

export type Dragable = {
  id: string;
  type: string;
  accept: string[];
  el: Element;
};

export const move = (
  ev: { source: Dragable; target: Dragable },
  list: string[],
) => {
  const sourceIdx = list.indexOf(ev.source.id);
  assert(sourceIdx !== -1);
  const targetIdx = list.indexOf(ev.target.id);

  if (sourceIdx === targetIdx) return list;

  const copy = [...list];
  const [removed] = copy.splice(sourceIdx, 1);
  copy.splice(targetIdx, 0, removed);

  return copy;
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

export const DnDProvider = (props: {
  children: React.ReactNode;
  onDragOver: (arg: any) => void;
}) => {
  const dragables = useRef(
    new Map<string, Dragable & { cleanup: VoidFunction }>(),
  );

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

      function onDragOver(event: DragEvent) {
        if (!dragging) {
          dragging = true;
        }

        let target = source;

        for (const dragable of dragables.current.values()) {
          const isPointerInside = isPointerInRect(
            dragable.el.getBoundingClientRect(),
            event,
          );

          if (isPointerInside) {
            target = dragable;
          }
        }

        if (target !== source) props.onDragOver({ source, target });
      }

      function onDragEnd() {
        clean();
      }

      function clean() {
        console.log('cln');
        if (cleaned) {
          return;
        }
        cleaned = true;
        style.remove();

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

      const f = (e: Event) => drag(e, dragable);
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
        () => ({ addDragable, removeDragable }),
        [addDragable, removeDragable],
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

export const useSortable = (
  id: string,
  options: {
    type: string;
    accept: string[];
  },
) => {
  const dndCtx = useDndContext();

  const cleanup = useRef(() => {});

  useEffect(
    () => () => {
      cleanup.current();
    },
    [],
  );

  return {
    ref: useCallback(
      (el: HTMLElement | null) => {
        if (!el) return;

        cleanup.current = dndCtx.addDragable({
          ...options,
          el,
          id,
        });
      },
      [dndCtx, id, options],
    ),
  };
};

