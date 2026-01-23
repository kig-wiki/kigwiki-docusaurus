import React, { useState, useMemo, useCallback, memo } from 'react';
import type { Hadatai } from '../plugins/docusaurus-plugin-maker-data';
import { useDebounce } from '../hooks/useDebounce';
import LinkIcon from './shared/LinkIcon';
import { SEARCH_DEBOUNCE_MS } from '../utils/makerSocialUtils';
import { filterHadataiBySearch, sortHadatai, supportsHadataiEnglishOrdering } from '../utils/filterUtils';
import type { SortConfig } from '../utils/filterUtils';
import { parseNotesWithLinks } from '../utils/textUtils';

interface HadataiCardsProps {
  className?: string;
  data: Hadatai[];
}

type HadataiSortConfig = SortConfig<Hadatai>;

const HadataiCard: React.FC<{ item: Hadatai }> = memo(({ item }) => {
  // More robust check for socials - ensure there are valid URLs
  const hasSocials = item.socials && 
    typeof item.socials === 'object' && 
    Object.keys(item.socials).length > 0 &&
    Object.values(item.socials).some(url => url && typeof url === 'string' && url.trim() !== '');
  
  const hasPriceExamples = item.priceExamples && item.priceExamples.length > 0;
  const hasNotes = typeof item.notes === 'string';

  return (
    <div className="hadatai-card">
      <div className="hadatai-card-header">
        <h3 className="hadatai-name">
          {item.name}
        </h3>
        {typeof item.region === 'string' && (
          <span className="region-badge">Ships from: {item.region}</span>
        )}
      </div>

      {supportsHadataiEnglishOrdering(item) && (
        <div className="hadatai-card-badges">
          <span className="english-ordering-badge">English Ordering Available</span>
        </div>
      )}

      <div className="hadatai-card-content">
        {hasSocials && (
          <div className="hadatai-field">
            <span className="field-label">Links:</span>
            <div className="links-container">
              {Object.entries(item.socials!).map(([platform, url]) => (
                <LinkIcon key={platform} platform={platform} url={String(url)} />
              ))}
            </div>
          </div>
        )}

        {hasPriceExamples && (
          <div className="hadatai-field">
            <span className="field-label">Price Examples:</span>
            <div className="price-examples">
              {item.priceExamples!.map((example, idx) => (
                <div key={idx} className="price-example">
                  <div className="price-example-type">{example.type}</div>
                  <div className="price-example-price">
                    {example.link ? (
                      <a 
                        href={example.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="price-link"
                      >
                        {example.price}
                      </a>
                    ) : (
                      example.price
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasNotes && typeof item.notes === 'string' && (
          <div className="hadatai-field">
            <span className="field-label">Notes:</span>
            <p className="notes">{parseNotesWithLinks(item.notes)}</p>
          </div>
        )}
      </div>
    </div>
  );
});

const HadataiCards: React.FC<HadataiCardsProps> = memo(({ className = '', data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnglishOnly, setShowEnglishOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState<HadataiSortConfig>({ key: 'name', direction: 'asc' });
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

  const filteredAndSortedHadatai = useMemo(() => {
    let filtered = data;

    // Apply English ordering filter
    if (showEnglishOnly) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(supportsHadataiEnglishOrdering);
      console.log(`English filter: ${beforeCount} → ${filtered.length} hadatai makers`);
    }

    // Apply search filter
    filtered = filterHadataiBySearch(filtered, debouncedSearchTerm);

    // Apply sorting
    return sortHadatai(filtered, sortConfig);
  }, [data, debouncedSearchTerm, showEnglishOnly, sortConfig]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleEnglishOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowEnglishOnly(e.target.checked);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const [key, direction] = e.target.value.split('-');
    
    // Validate the parsed values
    if (key && direction && (direction === 'asc' || direction === 'desc')) {
      setSortConfig({ 
        key: key as keyof Hadatai, 
        direction: direction as 'asc' | 'desc' 
      });
    }
  }, []);

  return (
    <div className={`hadatai-cards-container ${className}`}>
      <div className="hadatai-cards-header">
        <div className="hadatai-cards-search">
          <input
            type="text"
            placeholder="Search hadatai makers..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="hadatai-cards-filters">
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showEnglishOnly}
              onChange={handleEnglishOnlyChange}
            />
            <span className="filter-label">English ordering only</span>
          </label>
        </div>
        
        <div className="hadatai-cards-sort">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="region-asc">Region (A-Z)</option>
            <option value="region-desc">Region (Z-A)</option>
          </select>
        </div>
      </div>

      <div className="hadatai-cards-grid">
        {filteredAndSortedHadatai.length === 0 ? (
          <div className="no-results">
            {searchTerm ? 'No hadatai makers found matching your search.' : 'No hadatai data available.'}
          </div>
        ) : (
          filteredAndSortedHadatai.map((item, index) => (
            <HadataiCard key={`${item.name}-${index}`} item={item} />
          ))
        )}
      </div>

      <div className="hadatai-cards-info">
        <p>Showing {filteredAndSortedHadatai.length} of {data.length} hadatai makers</p>
      </div>
    </div>
  );
});

export default HadataiCards;