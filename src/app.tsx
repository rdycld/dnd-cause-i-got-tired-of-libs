import { useCallback, useState } from 'react';
import { DnDProvider } from './dnd';
import { useSortable } from './use-sortable';
import { assert } from './assert';

const Column = ({ id }: { id: string }) => {
  const { ref, isDragging } = useSortable(id, {
    type: 'column',
    accept: ['column'],
  });

  return (
    <div
      style={{
        padding: 10,
        border: '1px solid red',
        background: 'red',
        opacity: isDragging ? 0.5 : 1,
      }}
      draggable
      ref={ref}
    >
      hellooo - {id}
    </div>
  );
};

const items2 = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
export const App = () => {
  const [state, setState] = useState(items2);

  const handleDragOver = useCallback((ev: any) => {
    setState((p) => {
      const sourceIdx = p.findIndex((el) => el.id === ev.source.id);
      assert(sourceIdx !== -1);
      const targetIdx = p.findIndex((el) => el.id === ev.target.id);

      if (sourceIdx === targetIdx) return p;

      const copy = Array.from(p);
      const [removed] = copy.splice(sourceIdx, 1);
      copy.splice(targetIdx, 0, removed);

      return copy;
    });
  }, []);

  return (
    <>
      <DnDProvider onDragOver={handleDragOver}>
        <div
          style={{
            paddingTop: 20,
            display: 'flex',
            gap: 10,
          }}
        >
          {state.map(({ id }) => (
            <Column id={id} key={id} />
          ))}
        </div>
      </DnDProvider>
    </>
  );
};

