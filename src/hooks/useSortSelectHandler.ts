import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { SortConfig } from '../utils/filterUtils';

export function useSortSelectHandler<T extends object>(
  setSortConfig: Dispatch<SetStateAction<SortConfig<T>>>
) {
  return useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const [key, direction] = e.target.value.split('-');
      if (key && direction && (direction === 'asc' || direction === 'desc')) {
        setSortConfig({
          key: key as keyof T,
          direction,
        });
      }
    },
    [setSortConfig]
  );
}
