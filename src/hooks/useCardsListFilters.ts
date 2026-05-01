import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { SEARCH_DEBOUNCE_MS } from '../utils/makerSocialUtils';

export function useCardsListFilters(debounceMs = SEARCH_DEBOUNCE_MS) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnglishOnly, setShowEnglishOnly] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleEnglishOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowEnglishOnly(e.target.checked);
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    showEnglishOnly,
    handleSearchChange,
    handleEnglishOnlyChange,
  };
}
