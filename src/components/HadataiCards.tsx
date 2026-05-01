import React, { useState, useMemo, useCallback, memo } from 'react';
import type { Hadatai } from '../plugins/docusaurus-plugin-maker-data';
import LinksFieldGroup from './shared/LinksFieldGroup';
import { useCardsListFilters } from '../hooks/useCardsListFilters';
import { useSortSelectHandler } from '../hooks/useSortSelectHandler';
import {
  filterHadataiBySearch,
  filterHadataiByMaterialToggles,
  normalizeHadataiMaterial,
  sortHadatai,
  supportsHadataiEnglishOrdering,
} from '../utils/filterUtils';
import type { SortConfig } from '../utils/filterUtils';
import { parseNotesWithLinks } from '../utils/textUtils';

interface HadataiCardsProps {
  className?: string;
  data: Hadatai[];
}

type HadataiSortConfig = SortConfig<Hadatai>;

const HadataiCard: React.FC<{
  item: Hadatai;
  latexMaterialFilter: boolean;
  fabricMaterialFilter: boolean;
}> = memo(({ item, latexMaterialFilter, fabricMaterialFilter }) => {
  const visiblePriceExamples = useMemo(() => {
    const all = item.priceExamples ?? [];
    if (latexMaterialFilter === fabricMaterialFilter) return all;
    if (latexMaterialFilter) {
      return all.filter((ex) => normalizeHadataiMaterial(ex.material) === 'latex');
    }
    return all.filter((ex) => normalizeHadataiMaterial(ex.material) === 'fabric');
  }, [item.priceExamples, latexMaterialFilter, fabricMaterialFilter]);

  const hasPriceExamples = visiblePriceExamples.length > 0;
  const hasNotes = typeof item.notes === 'string';

  return (
    <div className="hadatai-card">
      <div className="hadatai-card-header">
        <h3 className="hadatai-name">{item.name}</h3>
      </div>

      <div className="hadatai-card-content">
        <LinksFieldGroup
          fieldClassName="hadatai-field"
          website={item.website}
          taobaoStore={item.taobaoStore}
          socials={item.socials}
        />

        {typeof item.region === 'string' && (
          <div className="hadatai-field inline">
            <span className="field-label">Ships from:</span>
            <span className="region">{item.region}</span>
          </div>
        )}

        {supportsHadataiEnglishOrdering(item) && (
          <div className="hadatai-field inline">
            <span className="field-label">English Ordering:</span>
            <span className="english-ordering">
              {typeof item.englishOrdering === 'string' ? item.englishOrdering : 'Available'}
            </span>
          </div>
        )}

        {hasPriceExamples && (
          <div className="hadatai-field">
            <span className="field-label">Price Examples:</span>
            <div className="price-examples">
              {visiblePriceExamples.map((example, idx) => (
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
  const {
    searchTerm,
    debouncedSearchTerm,
    showEnglishOnly,
    handleSearchChange,
    handleEnglishOnlyChange,
  } = useCardsListFilters();
  const [latexOnly, setLatexOnly] = useState(true);
  const [fabricOnly, setFabricOnly] = useState(true);
  const [sortConfig, setSortConfig] = useState<HadataiSortConfig>({ key: 'name', direction: 'asc' });
  const handleSortChange = useSortSelectHandler(setSortConfig);

  const handleLatexOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLatexOnly(e.target.checked);
  }, []);

  const handleFabricOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFabricOnly(e.target.checked);
  }, []);

  const filteredAndSortedHadatai = useMemo(() => {
    let filtered = data;

    if (showEnglishOnly) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(supportsHadataiEnglishOrdering);
      console.log(`English filter: ${beforeCount} → ${filtered.length} hadatai makers`);
    }

    filtered = filterHadataiByMaterialToggles(filtered, latexOnly, fabricOnly);

    filtered = filterHadataiBySearch(filtered, debouncedSearchTerm);
    return sortHadatai(filtered, sortConfig);
  }, [data, debouncedSearchTerm, showEnglishOnly, latexOnly, fabricOnly, sortConfig]);

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
          <div className="hadatai-cards-filters-row">
            <label className="filter-toggle">
              <input type="checkbox" checked={showEnglishOnly} onChange={handleEnglishOnlyChange} />
              <span className="filter-label">English ordering only</span>
            </label>
          </div>
          <div className="hadatai-cards-filters-row">
            <label className="filter-toggle">
              <input type="checkbox" checked={latexOnly} onChange={handleLatexOnlyChange} />
              <span className="filter-label">Latex Material</span>
            </label>
            <label className="filter-toggle">
              <input type="checkbox" checked={fabricOnly} onChange={handleFabricOnlyChange} />
              <span className="filter-label">Fabric Material</span>
            </label>
          </div>
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
            <HadataiCard
              key={`${item.name}-${index}`}
              item={item}
              latexMaterialFilter={latexOnly}
              fabricMaterialFilter={fabricOnly}
            />
          ))
        )}
      </div>

      <div className="hadatai-cards-info">
        <p>
          Showing {filteredAndSortedHadatai.length} of {data.length} hadatai makers
        </p>
      </div>
    </div>
  );
});

export default HadataiCards;
