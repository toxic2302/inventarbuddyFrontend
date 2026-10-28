import {flattenTree} from './tree-utils';

describe('flattenTree', () => {
  it('returns an empty list for an empty tree', () => {
    expect(flattenTree([])).toEqual([]);
  });

  it('keeps flat entries with their own name as label', () => {
    expect(
      flattenTree([
        {id: '1', name: 'Werkzeug'},
        {id: '2', name: 'Elektronik'},
      ]),
    ).toEqual([
      {id: '1', label: 'Werkzeug'},
      {id: '2', label: 'Elektronik'},
    ]);
  });

  it('builds "parent / child" labels for nested entries in depth-first order', () => {
    const result = flattenTree([
      {
        id: '1',
        name: 'Keller',
        children: [
          {id: '2', name: 'Regal', children: [{id: '3', name: 'Fach 1'}]},
          {id: '4', name: 'Schrank'},
        ],
      },
      {id: '5', name: 'Garage'},
    ]);

    expect(result).toEqual([
      {id: '1', label: 'Keller'},
      {id: '2', label: 'Keller / Regal'},
      {id: '3', label: 'Keller / Regal / Fach 1'},
      {id: '4', label: 'Keller / Schrank'},
      {id: '5', label: 'Garage'},
    ]);
  });

  it('skips entries without id but still includes their children with the full path', () => {
    expect(
      flattenTree([{name: 'Ohne Id', children: [{id: '1', name: 'Kind'}]}]),
    ).toEqual([{id: '1', label: 'Ohne Id / Kind'}]);
  });

  it('applies a given prefix to the top-level labels', () => {
    expect(flattenTree([{id: '1', name: 'A'}], 'Root / ')).toEqual([
      {id: '1', label: 'Root / A'},
    ]);
  });
});
