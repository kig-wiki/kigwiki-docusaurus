import React, { useState, useMemo, useCallback, memo } from 'react';
import type { Maker } from '../plugins/docusaurus-plugin-maker-data';
import { useDebounce } from '../hooks/useDebounce';
import LinkIcon from './shared/LinkIcon';
import StatusBadge from './shared/StatusBadge';
import { SEARCH_DEBOUNCE_MS } from '../utils/makerSocialUtils';
import { 
  filterMakersBySearch, 
  sortMakers, 
  supportsEnglishOrdering 
} from '../utils/filterUtils';
import type { SortConfig } from '../utils/filterUtils';

interface MakersCardsProps {
  className?: string;
  data: Maker[];
}

type MakerSortConfig = SortConfig<Maker>;

const MakerCard: React.FC<{ maker: Maker }> = memo(({ maker }) => {
  const hasWebsite = maker.website && typeof maker.website === 'string' && maker.website.trim() !== '';
  
  // More robust check for socials - ensure there are valid URLs
  const hasSocials = maker.socials && 
    typeof maker.socials === 'object' && 
    Object.keys(maker.socials).length > 0 &&
    Object.values(maker.socials).some(url => url && typeof url === 'string' && url.trim() !== '');
  
  const hasLinks = hasWebsite || hasSocials;
  const hasFeatures = maker.features && typeof maker.features === 'object' && 
                     Object.entries(maker.features).filter(([key, value]) => value === true).length > 0;
  const hasNotes = typeof maker.notes === 'string';

  return (
    <div className="maker-card">
      <div className="maker-card-header">
        <h3 className="maker-name">
          {typeof maker.name === 'string' ? maker.name : 'Unknown'}
          {maker.alias && typeof maker.alias === 'string' && (
            <span className="maker-alias"> ({maker.alias})</span>
          )}
        </h3>
        <StatusBadge status={maker.status} />
      </div>

      <div className="maker-card-content">
        {hasLinks && (
          <div className="maker-field">
            <span className="field-label">Links:</span>
            <div className="links-container">
              {hasWebsite && (
                <LinkIcon platform="website" url={maker.website!} isWebsite={true} />
              )}
              {hasSocials && Object.entries(maker.socials!).map(([platform, url]) => (
                <LinkIcon key={platform} platform={platform} url={String(url)} />
              ))}
            </div>
          </div>
        )}

        {typeof maker.priceTier === 'string' && (
          <div className="maker-field inline">
            <span className="field-label">Price Tier:</span>
            <span className="price-tier">{maker.priceTier}</span>
          </div>
        )}

        {typeof maker.region === 'string' && (
          <div className="maker-field inline">
            <span className="field-label">Ships from:</span>
            <span className="region">{maker.region}</span>
          </div>
        )}

        {typeof maker.size === 'string' && (
          <div className="maker-field inline">
            <span className="field-label">Size:</span>
            <span className="size">{maker.size}</span>
          </div>
        )}

        {typeof maker.materialType === 'string' && (
          <div className="maker-field inline">
            <span className="field-label">Material:</span>
            <span className="material-type">{maker.materialType}</span>
          </div>
        )}

        {supportsEnglishOrdering(maker) && (
          <div className="maker-field inline">
            <span className="field-label">English Ordering:</span>
            <span className="english-ordering">
              {typeof maker.englishOrdering === 'string' ? maker.englishOrdering : 'Available'}
            </span>
          </div>
        )}

        {hasFeatures && (
          <div className="maker-field">
            <span className="field-label">Features:</span>
            <div className="features-list">
              {Object.entries(maker.features!)
                .filter(([key, value]) => value === true)
                .map(([key]) => (
                  <span key={key} className="feature-badge">
                    {key}
                  </span>
                ))
              }
            </div>
          </div>
        )}

        {hasNotes && (
          <div className="maker-field">
            <span className="field-label">Notes:</span>
            <p className="notes">{maker.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
});

const MakersCards: React.FC<MakersCardsProps> = memo(({ className = '', data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnglishOnly, setShowEnglishOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState<MakerSortConfig>({ key: 'name', direction: 'asc' });
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

  const filteredAndSortedMakers = useMemo(() => {
    let filtered = data;

    // Apply English ordering filter
    if (showEnglishOnly) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(supportsEnglishOrdering);
      console.log(`English filter: ${beforeCount} → ${filtered.length} makers`);
    }

    // Apply search filter
    filtered = filterMakersBySearch(filtered, debouncedSearchTerm);

    // Apply sorting
    return sortMakers(filtered, sortConfig);
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
        key: key as keyof Maker, 
        direction: direction as 'asc' | 'desc' 
      });
    }
  }, []);

  return (
    <div className={`makers-cards-container ${className}`}>
      <div className="makers-cards-header">
        <div className="makers-cards-search">
          <input
            type="text"
            placeholder="Search makers..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="makers-cards-filters">
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showEnglishOnly}
              onChange={handleEnglishOnlyChange}
            />
            <span className="filter-label">English ordering only</span>
          </label>
        </div>
        
        <div className="makers-cards-sort">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="status-asc">Status (Open first)</option>
            <option value="status-desc">Status (Closed first)</option>
            <option value="priceTier-asc">Price Tier (Low to High)</option>
            <option value="priceTier-desc">Price Tier (High to Low)</option>
            <option value="region-asc">Region (A-Z)</option>
            <option value="region-desc">Region (Z-A)</option>
          </select>
        </div>
      </div>

      <div className="makers-cards-grid">
        {filteredAndSortedMakers.length === 0 ? (
          <div className="no-results">
            {searchTerm ? 'No makers found matching your search.' : 'No makers data available.'}
          </div>
        ) : (
          filteredAndSortedMakers.map((maker: Maker, index: number) => (
            <MakerCard key={`${maker.name}-${index}`} maker={maker} />
          ))
        )}
      </div>

      <div className="makers-cards-info">
        <p>Showing {filteredAndSortedMakers.length} of {data.length} makers</p>
      </div>
    </div>
  );
});

export default MakersCards;