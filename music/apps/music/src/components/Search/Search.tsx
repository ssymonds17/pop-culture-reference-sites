'use client';

import axios from 'axios';
import _ from 'lodash';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { Album, Artist, Variation } from '../../types';
import { SearchResultsDisplay } from './SearchResultsDisplay';

export const Search = ({
  id,
  variation,
  setSearchResult,
  showLabel = true,
}: {
  id: string;
  variation: Variation;
  setSearchResult: (result: any) => void;
  showLabel?: boolean;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[] | Album[]>([]);

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
  };
  const handleOnSearch = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/search?searchString=${searchTerm}&itemType=${variation}`,
        {}
      );

      setSearchResults(response.data.result);
    } catch (error) {
      console.error('error', error);
    }
  };

  const handleSetSearchResult = (item: Artist | Album) => {
    setSearchResult(item);
    setSearchTerm(''); // Clear the search term after selection
    setSearchResults([]); // Clear the search results after selection
  };

  return (
    <div className="form-group relative">
      {showLabel && (
        <label htmlFor={id} className="form-label">
          {_.upperFirst(id)}
        </label>
      )}
      <div className="flex gap-2">
        <input
          className="form-control flex-1"
          onChange={handleOnChange}
          value={searchTerm ?? ''}
          type="search"
          id={id}
          name={id}
          placeholder={`Search ${variation}s...`}
        />
        <button
          type="button"
          className="btn-search-primary"
          disabled={searchTerm === ''}
          onClick={handleOnSearch}
        >
          Search
        </button>
      </div>
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1">
          <SearchResultsDisplay
            searchItems={searchResults}
            setSearchResult={handleSetSearchResult}
          />
        </div>
      )}
    </div>
  );
};
