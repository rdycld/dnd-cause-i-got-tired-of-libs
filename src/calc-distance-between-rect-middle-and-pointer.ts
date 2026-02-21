export const calcDistanceBetweenRectMiddleAndPointer = (
  rect: DOMRect,
  { clientX, clientY }: { clientX: number; clientY: number },
) => {
  const rectMiddleX = rect.left + rect.width / 2;
  const rectMiddleY = rect.top + rect.height / 2;

  return ((rectMiddleX - clientX) ** 2 + (rectMiddleY - clientY) ** 2) ** 0.5;
};

