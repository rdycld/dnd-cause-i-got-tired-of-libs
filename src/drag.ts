export const drag = (
  e: Event,
  options: {
    onBeforeDragStart?: () => void;
    onDragStart?: (e: Event) => void;
    onDrag?: (event: MouseEvent) => void;
    onDragEnd?: (event: MouseEvent) => void;
  } = {},
) => {
  if (!(e.currentTarget instanceof Element) || !e.currentTarget) return;
  options.onBeforeDragStart?.();

  let dragging = false;
  let cleaned = false;

  const style = document.createElement('style');
  style.innerHTML = `* { cursor:grabbing !important}`;
  document.head.appendChild(style);

  document.documentElement.addEventListener('pointermove', onDrag);
  document.documentElement.addEventListener('pointerup', onDragEnd);

  function onDrag(event: MouseEvent) {
    if (!dragging) {
      dragging = true;
      options.onDragStart?.(e);
    }

    options.onDrag?.(event);
  }

  function onDragEnd(e: MouseEvent) {
    clean(e);
  }

  function clean(e: MouseEvent) {
    if (cleaned) {
      return;
    }
    cleaned = true;
    style.remove();

    options.onDragEnd?.(e);

    if (dragging) {
      dragging = false;
    }

    document.documentElement.removeEventListener('pointermove', onDrag);
    document.documentElement.removeEventListener('pointerup', onDragEnd);
  }
};

