const ENGLISH_ON = new Set(['1', 'true', 'on']);

export type CardsListQueryState = {
  q: string;
  english: boolean;
  latex: boolean;
  fabric: boolean;
};

export function parseCardsListQuery(search: string): CardsListQueryState {
  const params = new URLSearchParams(search);
  const q = params.get('q') ?? '';
  const english = ENGLISH_ON.has((params.get('english') ?? '').toLowerCase());
  const material = (params.get('material') ?? '').toLowerCase();

  if (material === 'latex') {
    return { q, english, latex: true, fabric: false };
  }
  if (material === 'fabric') {
    return { q, english, latex: false, fabric: true };
  }
  return { q, english, latex: true, fabric: true };
}

export function serializeCardsListQuery(
  state: CardsListQueryState,
  existingSearch: string,
  { syncMaterials }: { syncMaterials: boolean }
): string {
  const params = new URLSearchParams(existingSearch);
  const q = state.q.trim();

  if (q) {
    params.set('q', q);
  } else {
    params.delete('q');
  }

  if (state.english) {
    params.set('english', 'true');
  } else {
    params.delete('english');
  }

  if (syncMaterials) {
    if (state.latex && !state.fabric) {
      params.set('material', 'latex');
    } else if (!state.latex && state.fabric) {
      params.set('material', 'fabric');
    } else {
      params.delete('material');
    }
  }

  return params.toString();
}

export function replaceLocationSearch(search: string): void {
  const url = new URL(window.location.href);
  const nextSearch = search ? `?${search}` : '';
  if (url.search === nextSearch) {
    return;
  }
  url.search = search;
  window.history.replaceState(window.history.state, '', url);
}
