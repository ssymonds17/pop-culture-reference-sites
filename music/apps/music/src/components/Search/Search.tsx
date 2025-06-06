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
    <div className="relative">
      {showLabel && (
        <>
          <label htmlFor={id}>{_.upperFirst(id)}</label>
          <br />
        </>
      )}
      <div className="flex border-2 w-full justify-between">
        <input
          className="w-full"
          onChange={handleOnChange}
          value={searchTerm ?? ''}
          type="text"
          id={id}
          name={id}
        />
        <button
          type="button"
          className="bg-blue-500 text-white border-2 border-blue-500"
          disabled={!searchTerm.trim()}
          onClick={handleOnSearch}
        >
          Search
        </button>
      </div>
      {searchResults.length > 0 && (
        <SearchResultsDisplay
          searchItems={searchResults}
          setSearchResult={handleSetSearchResult}
        />
      )}
    </div>
  );
};
