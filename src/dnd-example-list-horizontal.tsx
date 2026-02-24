import { useCallback, useState } from 'react';
import { assert } from './assert';
import { createDndStore, type Dragable } from './dnd-store';
import { genItem } from './examples-helpers';
import { Item } from './item';

const { useMonitor, useSortable } = createDndStore();

const items = Array.from({ length: 100 }, () => genItem());

export const DnDExampleListHorizontal = () => {
  const [state, setState] = useState(items);

  const onDragStateChange = useCallback(
    ({
      source: source,
      target,
    }: {
      source: Dragable | undefined;
      target: Dragable | undefined;
    }) => {
      if (!(source && target)) return;

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
        gap: 10,
        justifyContent: 'stretch',
      }}
    >
      {state.map((p) => (
        <Item key={p.id} {...p} useSortable={useSortable} />
      ))}
    </div>
  );
};

