export const genNextLabel = (() => {
  let label = 0;
  return (suffix = '') => `${++label}-${suffix}`;
})();

export const genItem = () => ({
  id: crypto.randomUUID(),
  label: genNextLabel('item'),
});

export const genColumn = (n = 3) => ({
  id: crypto.randomUUID(),
  label: genNextLabel('column'),
  items: Array.from({ length: n }, () => genItem()),
});

