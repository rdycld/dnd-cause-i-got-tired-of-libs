import { memo } from 'react';

export const Item = memo(
  ({
    id,
    label,
    color,
    height,
    useSortable,
  }: {
    id: string;
    label: string;
    height: number;
    color: string;
    useSortable: any;
  }) => {
    const { ref, isDragging } = useSortable(id, {
      type: 'child',
      accept: ['child'],
    });

    return (
      <div
        id={id}
        ref={ref}
        style={{
          userSelect: 'none',
          border: '1px solid yellow',
          background: 'cyan',
          padding: 10,
          minWidth: 100,
          height,
          backgroundColor: color,

          opacity: isDragging ? 0.5 : 1,
        }}
      >
        {label}
      </div>
    );
  },
);

