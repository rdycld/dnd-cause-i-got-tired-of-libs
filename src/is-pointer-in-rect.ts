export const isPointerInRect = (
  rect: DOMRect,
  { clientX, clientY }: { clientX: number; clientY: number },
) => {
  let isInside = true;

  if (clientX < rect.left || clientX > rect.right) isInside = false;
  if (clientY > rect.bottom || clientY < rect.top) isInside = false;

  return isInside;
};
