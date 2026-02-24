import { memo, useCallback, useState } from 'react';
import { assert } from './assert';
import { createDndStore, type Dragable } from './dnd-store';
import { genColumn } from './examples-helpers';
import { Item } from './item';

const { useMonitor, useSortable } = createDndStore();

const Column = memo(
  ({
    id,
    items,
    label,
    color,
  }: {
    id: string;
    label: string;
    items: { id: string; label: string }[];
    color: string;
  }) => {
    const { ref, isDragging } = useSortable(id, {
      type: 'parent',
      accept: ['parent', 'child'],
      items,
    });

    return (
      <div
        style={{
          userSelect: 'none',
          padding: 10,
          minWidth: 150,
          border: '1px solid red',
          background: color,
          opacity: isDragging ? 0.5 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
        ref={ref}
      >
        {label}
        {items.map((item: any) => (
          <Item key={item.id} {...item} useSortable={useSortable} />
        ))}
      </div>
    );
  },
);

const items2 = Array.from({ length: 5 }, () => genColumn(5));
export const DnDExampleNestedListVertical = () => {
  const [state, setState] = useState(items2);

  const onDragStateChange = useCallback(
    ({
      source: source,
      target,
    }: {
      source: Dragable | undefined;
      target: Dragable | undefined;
    }) => {
      if (!(source && target)) return;

      if (source.type === 'parent') {
        setState((p) => {
          // move in array
          const sourceIdx = p.findIndex((el) => el.id === source.id);
          assert(sourceIdx !== -1);
          const targetIdx = p.findIndex((el) => el.id === target.id);

          if (sourceIdx === targetIdx) return p;

          const copy = Array.from(p);
          const [removed] = copy.splice(sourceIdx, 1);
          copy.splice(targetIdx, 0, removed);

          return copy;
        });
        return;
      }

      setState((p) => {
        const sourceCol = p.find((col) =>
          col.items.some((el) => el.id === source.id),
        );
        assert(sourceCol);

        // here handle adding to an empty column
        let targetCol = p.find((col) =>
          col.items.some((el) => el.id === target.id),
        );

        if (!targetCol) {
          targetCol = p.find((col) => col.id === target.id);
          assert(targetCol);
        }

        const sourceIdx = sourceCol.items.findIndex(
          (el) => el.id === source.id,
        );
        assert(sourceIdx !== -1);
        let targetIdx = targetCol.items.findIndex((el) => el.id === target.id);

        //nothing changed, not at all
        if (sourceCol === targetCol && sourceIdx === targetIdx) return p;

        const sourceCopy = Array.from(sourceCol.items);
        const targetCopy = Array.from(targetCol.items);

        const [removed] = sourceCopy.splice(sourceIdx, 1);

        const updatedSourceCol = {
          ...sourceCol,
          items: sourceCopy,
        };

        if (sourceCol === targetCol) {
          sourceCopy.splice(targetIdx, 0, removed);
        } else {
          targetIdx =
            targetIdx === targetCopy.length - 1 ? targetIdx + 1 : targetIdx;

          targetCopy.splice(targetIdx, 0, removed);
        }

        const updatedTargetCol = {
          ...targetCol,
          items: targetCopy,
        };

        return p.map((el) =>
          el.id === updatedSourceCol.id
            ? updatedSourceCol
            : el.id === updatedTargetCol.id
            ? updatedTargetCol
            : el,
        );
      });
    },
    [],
  );

  useMonitor(onDragStateChange);

  return (
    <div
      style={{
        margin: 100,
        paddingTop: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        justifyContent: 'stretch',
      }}
    >
      {state.map((c) => (
        <Column key={c.id} {...c} />
      ))}
    </div>
  );
};

