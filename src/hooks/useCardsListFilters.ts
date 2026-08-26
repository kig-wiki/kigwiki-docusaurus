import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useDebounce } from './useDebounce';
import { SEARCH_DEBOUNCE_MS } from '../utils/makerSocialUtils';
import {
  parseCardsListQuery,
  serializeCardsListQuery,
  replaceLocationSearch,
} from '../utils/cardsListQuery';

type UseCardsListFiltersOptions = {
  debounceMs?: number;
  syncMaterials?: boolean;
};

export function useCardsListFilters({
  debounceMs = SEARCH_DEBOUNCE_MS,
  syncMaterials = false,
}: UseCardsListFiltersOptions = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnglishOnly, setShowEnglishOnly] = useState(false);
  const [latexOnly, setLatexOnly] = useState(true);
  const [fabricOnly, setFabricOnly] = useState(true);
  const [urlReady, setUrlReady] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  useLayoutEffect(() => {
    const parsed = parseCardsListQuery(window.location.search);
    setSearchTerm(parsed.q);
    setShowEnglishOnly(parsed.english);
    if (syncMaterials) {
      setLatexOnly(parsed.latex);
      setFabricOnly(parsed.fabric);
    }
    setUrlReady(true);
  }, [syncMaterials]);

  useEffect(() => {
    if (!urlReady) {
      return;
    }
    if (searchTerm !== debouncedSearchTerm) {
      return;
    }
    const nextSearch = serializeCardsListQuery(
      {
        q: debouncedSearchTerm,
        english: showEnglishOnly,
        latex: latexOnly,
        fabric: fabricOnly,
      },
      window.location.search,
      { syncMaterials }
    );
    replaceLocationSearch(nextSearch);
  }, [
    urlReady,
    searchTerm,
    debouncedSearchTerm,
    showEnglishOnly,
    latexOnly,
    fabricOnly,
    syncMaterials,
  ]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleEnglishOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowEnglishOnly(e.target.checked);
  }, []);

  const handleLatexOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLatexOnly(e.target.checked);
  }, []);

  const handleFabricOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFabricOnly(e.target.checked);
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    showEnglishOnly,
    latexOnly,
    fabricOnly,
    handleSearchChange,
    handleEnglishOnlyChange,
    handleLatexOnlyChange,
    handleFabricOnlyChange,
  };
}
