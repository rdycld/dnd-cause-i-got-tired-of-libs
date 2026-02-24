export const genNextLabel = (() => {
  let label = 0;
  return (suffix = '') => `${++label}-${suffix}`;
})();

export const genItem = () => {
  const heights = JSON.parse(localStorage.getItem('item-heights') ?? '[100]');
  const colors = JSON.parse(localStorage.getItem('colors') ?? '["#0f0"]');

  return {
    id: crypto.randomUUID(),
    label: genNextLabel('item'),
    height: heights[Math.floor(Math.random() * 100)],
    color: colors[Math.floor(Math.random() * 100)],
  };
};

export const genColumn = (n = 3) => {
  const colors = JSON.parse(localStorage.getItem('colors') ?? '["#0f0"]');
  return {
    id: crypto.randomUUID(),
    label: genNextLabel('column'),
    items: Array.from({ length: n }, () => genItem()),
    color: colors[Math.floor(Math.random() * 100)],
  };
};

