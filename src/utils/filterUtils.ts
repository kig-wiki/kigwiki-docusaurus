// Shared filtering and sorting utilities

import type { Maker } from '../plugins/docusaurus-plugin-maker-data';
import type { Hadatai } from '../plugins/docusaurus-plugin-maker-data';

// Generic search interface
interface SearchableItem {
  name: string;
  [key: string]: unknown;
}

// Generic sort configuration
export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

// Helper function for generic search filtering
export const createSearchFilter = <T extends SearchableItem>(
  searchableFields: (keyof T)[]
) => {
  return (data: T[], searchTerm: string): T[] => {
    if (!searchTerm.trim()) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      const fieldValues = searchableFields.map(field => {
        const value = item[field];
        return typeof value === 'string' ? value.toLowerCase() : '';
      });
      
      return fieldValues.some(field => field.includes(term));
    });
  };
};

// Helper function for generic sorting
export const createSorter = <T extends Record<string, unknown>>() => {
  return (data: T[], sortConfig: SortConfig<T>): T[] => {
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bVal === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
      
      // Handle string comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return 0;
    });
  };
};

// Specific filter for Hadatai
export const filterHadataiBySearch = (data: Hadatai[], searchTerm: string): Hadatai[] => {
  if (!searchTerm.trim()) return data;
  
  const term = searchTerm.toLowerCase();
  return data.filter(item => {
    const searchableFields = [
      item.name.toLowerCase(),
      item.region?.toLowerCase() || '',
      item.notes?.toLowerCase() || '',
    ];
    
    const priceExamplesMatch = item.priceExamples?.some(example =>
      example.type.toLowerCase().includes(term) ||
      example.price.toString().toLowerCase().includes(term)
    ) || false;
    
    return searchableFields.some(field => field.includes(term)) || priceExamplesMatch;
  });
};

// Specific filter for Makers
export const filterMakersBySearch = (data: Maker[], searchTerm: string): Maker[] => {
  if (!searchTerm.trim()) return data;
  
  const term = searchTerm.toLowerCase();
  return data.filter(maker => {
    const searchableFields = [
      maker.name.toLowerCase(),
      maker.alias?.toLowerCase() || '',
      maker.notes?.toLowerCase() || '',
      maker.priceRange?.toLowerCase() || '',
      maker.priceTier?.toLowerCase() || '',
      maker.type?.toLowerCase() || '',
      maker.region?.toLowerCase() || '',
      maker.size?.toLowerCase() || '',
      maker.materialType?.toLowerCase() || '',
    ];
    
    const englishOrderingMatch = typeof maker.englishOrdering === 'string' && 
                                maker.englishOrdering.toLowerCase().includes(term);
    
    const featuresMatch = maker.features && Object.entries(maker.features)
      .filter(([key, value]) => value === true)
      .some(([key]) => key.toLowerCase().includes(term));
    
    return searchableFields.some(field => field.includes(term)) || 
           englishOrderingMatch || 
           featuresMatch;
  });
};

// Helper function to check if maker supports English ordering
export const supportsEnglishOrdering = (maker: Maker): boolean => {
  return maker.englishOrdering !== false && 
         maker.englishOrdering !== null && 
         maker.englishOrdering !== undefined;
};

// Helper function to check if hadatai supports English ordering
export const supportsHadataiEnglishOrdering = (hadatai: Hadatai): boolean => {
  return hadatai.englishOrdering !== false && 
         hadatai.englishOrdering !== null && 
         hadatai.englishOrdering !== undefined;
};

// Helper function to extract numeric price from price strings
export const extractNumericPrice = (priceStr: string): number | null => {
  if (!priceStr || typeof priceStr !== 'string') return null;
  
  // Look for patterns like "$784 USD", "$200-300", "¥3200-3500", etc.
  const match = priceStr.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) {
    const numericStr = match[1].replace(/,/g, '');
    const num = parseFloat(numericStr);
    return isNaN(num) ? null : num;
  }
  
  return null;
};

// Specific sorter for Makers with price range handling
export const sortMakers = (data: Maker[], sortConfig: SortConfig<Maker>): Maker[] => {
  return [...data].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    // Handle undefined values
    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bVal === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
    
    // Special handling for price range sorting
    if (sortConfig.key === 'priceRange') {
      const aPrice = extractNumericPrice(aVal as string);
      const bPrice = extractNumericPrice(bVal as string);
      
      if (aPrice === null && bPrice === null) return 0;
      if (aPrice === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bPrice === null) return sortConfig.direction === 'asc' ? -1 : 1;
      
      return sortConfig.direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
    }
    
    // Handle string comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return 0;
  });
};

// Generic sorter for Hadatai
export const sortHadatai = (data: Hadatai[], sortConfig: SortConfig<Hadatai>): Hadatai[] => {
  return [...data].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    // Handle undefined values
    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bVal === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
    
    // Handle string comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return 0;
  });
};
