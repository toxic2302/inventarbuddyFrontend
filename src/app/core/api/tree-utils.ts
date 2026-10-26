export interface FlatOption {
  id: string;
  label: string;
}

interface TreeDto {
  id?: string;
  name: string;
  children?: TreeDto[];
}

/** Flacht einen Baum zu "Eltern / Kind"-Labels ab (z. B. für Auswahllisten). */
export function flattenTree(list: TreeDto[], prefix = ''): FlatOption[] {
  return list.flatMap((dto) => {
    const label = prefix + dto.name;
    return [
      ...(dto.id ? [{ id: dto.id, label }] : []),
      ...flattenTree(dto.children ?? [], label + ' / '),
    ];
  });
}
