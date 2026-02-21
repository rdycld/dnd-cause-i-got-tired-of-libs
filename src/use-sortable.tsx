import { useCallback, useEffect, useRef } from 'react';
import { useDndContext } from './dnd';

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
    isDragging: dndCtx.draggingId === id,
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

