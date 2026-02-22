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

const getPage = (): keyof typeof examples => {
  const sp = new URLSearchParams(window.location.search);

  const example = sp.get('example') ?? 'listVertical';

  return Object.keys(examples).includes(example)
    ? (example as keyof typeof examples)
    : 'listVertical';
};

export const App = () => {
  const [example, setExample] = useState<keyof typeof examples>(getPage());

  const changeExample = (example: keyof typeof examples) => {
    window.history.replaceState('', '', `?example=${example}`);
    setExample(example);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 20 }}>
        <label>
          vertical list
          <input
            type='checkbox'
            checked={example === 'listVertical'}
            onChange={(e) =>
              e.target.checked ? changeExample('listVertical') : undefined
            }
          />
        </label>
        <label>
          horizontal list
          <input
            type='checkbox'
            checked={example === 'listHorizontal'}
            onChange={(e) =>
              e.target.checked ? changeExample('listHorizontal') : undefined
            }
          />
        </label>
        <label>
          grid
          <input
            type='checkbox'
            checked={example === 'grid'}
            onChange={(e) =>
              e.target.checked ? changeExample('grid') : undefined
            }
          />
        </label>
        <label>
          nested list vertical
          <input
            type='checkbox'
            checked={example === 'nestedListVertical'}
            onChange={(e) =>
              e.target.checked ? changeExample('nestedListVertical') : undefined
            }
          />
        </label>
        <label>
          nested list horizontal
          <input
            type='checkbox'
            checked={example === 'nesteListHorizontal'}
            onChange={(e) =>
              e.target.checked
                ? changeExample('nesteListHorizontal')
                : undefined
            }
          />
        </label>
        <label>
          nested grids
          <input
            type='checkbox'
            checked={example === 'nestedGrids'}
            onChange={(e) =>
              e.target.checked ? changeExample('nestedGrids') : undefined
            }
          />
        </label>
      </div>

      {examples[example]}
    </div>
  );
};

