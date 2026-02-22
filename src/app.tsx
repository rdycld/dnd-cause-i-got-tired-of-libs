import { useState } from 'react';
import { DnDExampleListVertical } from './dnd-example-list-vertical';
import { DnDExampleListHorizontal } from './dnd-example-list-horizontal';
import { DnDExampleGrid } from './dnd-example-grid';
import { DnDExampleNestedListHorizontal } from './dnd-example-nested-list-horizontal';
import { DnDExampleNestedGrid } from './dnd-example-nested-grids';
import { DnDExampleNestedListVertical } from './dnd-example-nested-list-vertical';

const examples = {
  listVertical: <DnDExampleListVertical />,
  listHorizontal: <DnDExampleListHorizontal />,
  grid: <DnDExampleGrid />,
  nestedListVertical: <DnDExampleNestedListVertical />,
  nesteListHorizontal: <DnDExampleNestedListHorizontal />,
  nestedGrids: <DnDExampleNestedGrid />,
};

export const App = () => {
  const [example, setExample] = useState<keyof typeof examples>('listVertical');
  return (
    <div>
      <div style={{ display: 'flex', gap: 20 }}>
        <label>
          vertical list
          <input
            type='checkbox'
            checked={example === 'listVertical'}
            onChange={(e) =>
              e.target.checked ? setExample('listVertical') : undefined
            }
          />
        </label>
        <label>
          horizontal list
          <input
            type='checkbox'
            checked={example === 'listHorizontal'}
            onChange={(e) =>
              e.target.checked ? setExample('listHorizontal') : undefined
            }
          />
        </label>
        <label>
          grid
          <input
            type='checkbox'
            checked={example === 'grid'}
            onChange={(e) =>
              e.target.checked ? setExample('grid') : undefined
            }
          />
        </label>
        <label>
          nested list vertical
          <input
            type='checkbox'
            checked={example === 'nestedListVertical'}
            onChange={(e) =>
              e.target.checked ? setExample('nestedListVertical') : undefined
            }
          />
        </label>
        <label>
          nested list horizontal
          <input
            type='checkbox'
            checked={example === 'nesteListHorizontal'}
            onChange={(e) =>
              e.target.checked ? setExample('nesteListHorizontal') : undefined
            }
          />
        </label>
        <label>
          nested grids
          <input
            type='checkbox'
            checked={example === 'nestedGrids'}
            onChange={(e) =>
              e.target.checked ? setExample('nestedGrids') : undefined
            }
          />
        </label>
      </div>

      {examples[example]}
    </div>
  );
};

