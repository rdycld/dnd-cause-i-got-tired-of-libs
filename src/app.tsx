import { useCallback, useState } from 'react';
import { DnDProvider, move, useSortable } from './dnd';

const Item = ({ id }: { id: string }) => {
  const { ref } = useSortable(id, {
    type: 'item',
    accept: ['item'],
  });

  return (
    <div style={{ padding: 10, border: '1px solid red' }} draggable ref={ref}>
      hellooo - {id}
    </div>
  );
};

const items = ['1', '2', '3', '4'];
export const App = () => {
  const [state, setState] = useState(items);

  const handleDragOver = useCallback((ev) => {
    setState((p) => move(ev, p));
  }, []);

  return (
    <>
      <DnDProvider onDragOver={handleDragOver}>
        <div
          style={{
            display: 'flex',
          }}
        >
          {state.map((id) => (
            <Item id={id} key={id} />
          ))}
        </div>
      </DnDProvider>
    </>
  );
};

