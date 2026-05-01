import React, { useState, useMemo, memo } from 'react';
import type { Maker } from '../plugins/docusaurus-plugin-maker-data';
import LinksFieldGroup from './shared/LinksFieldGroup';
import { useCardsListFilters } from '../hooks/useCardsListFilters';
import { useSortSelectHandler } from '../hooks/useSortSelectHandler';
import {
  filterMakersBySearch,
  sortMakers,
  supportsEnglishOrdering,
} from '../utils/filterUtils';
import type { SortConfig } from '../utils/filterUtils';
import { parseNotesWithLinks } from '../utils/textUtils';

interface MakersCardsProps {
  className?: string;
  data: Maker[];
}

type MakerSortConfig = SortConfig<Maker>;

const MakerCard: React.FC<{ maker: Maker }> = memo(({ maker }) => {
  const hasFeatures =
    maker.features &&
    typeof maker.features === 'object' &&
    Object.entries(maker.features).filter(([, value]) => value === true).length > 0;
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
      </div>

      <div className="maker-card-content">
        <LinksFieldGroup
          fieldClassName="maker-field"
          website={maker.website}
          taobaoStore={maker.taobaoStore}
          socials={maker.socials}
        />

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
                .filter(([, value]) => value === true)
                .map(([key]) => (
                  <span key={key} className="feature-badge">
                    {key}
                  </span>
                ))}
            </div>
          </div>
        )}

        {hasNotes && typeof maker.notes === 'string' && (
          <div className="maker-field">
            <span className="field-label">Notes:</span>
            <p className="notes">{parseNotesWithLinks(maker.notes)}</p>
          </div>
        )}
      </div>
    </div>
  );
});

const MakersCards: React.FC<MakersCardsProps> = memo(({ className = '', data }) => {
  const {
    searchTerm,
    debouncedSearchTerm,
    showEnglishOnly,
    handleSearchChange,
    handleEnglishOnlyChange,
  } = useCardsListFilters();
  const [sortConfig, setSortConfig] = useState<MakerSortConfig>({ key: 'name', direction: 'asc' });
  const handleSortChange = useSortSelectHandler(setSortConfig);

  const filteredAndSortedMakers = useMemo(() => {
    let filtered = data;

    if (showEnglishOnly) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(supportsEnglishOrdering);
      console.log(`English filter: ${beforeCount} → ${filtered.length} makers`);
    }

    filtered = filterMakersBySearch(filtered, debouncedSearchTerm);
    return sortMakers(filtered, sortConfig);
  }, [data, debouncedSearchTerm, showEnglishOnly, sortConfig]);

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
            <input type="checkbox" checked={showEnglishOnly} onChange={handleEnglishOnlyChange} />
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
        <p>
          Showing {filteredAndSortedMakers.length} of {data.length} makers
        </p>
      </div>
    </div>
  );
});

export default MakersCards;
