'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { InputField } from '../../components/InputField';
import { Album } from '../../types';
import { AlbumsTable } from '../../components';
import { useScrollToTop } from '../../utils';

const AlbumsPage = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [formValues, setFormValues] = useState<Partial<Album>>({});
  const [isFetchingAlbums, setIsFetchingAlbums] = useState(false);
  const [isSearchingAlbums, setIsSearchingAlbums] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<
    'RATED' | 'GOLD' | 'SILVER' | 'ALL'
  >('RATED');
  const [yearFilter, setYearFilter] = useState<string>('');
  useScrollToTop();

  const handleGetAlbums = async () => {
    try {
      setIsFetchingAlbums(true);

      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (ratingFilter !== 'RATED') {
        params.append('rating', ratingFilter);
      }
      if (yearFilter) {
        params.append('year', yearFilter);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_URL}/albums?${queryString}`
        : `${API_URL}/albums`;

      const getAlbumsResponse = await axios.get(url);
      setAlbums(getAlbumsResponse.data.albums);
    } catch (error) {
      setAlbums([]);
      setFormValues({});
      console.log('error', error);
    } finally {
      setIsFetchingAlbums(false);
    }
  };

  const handleSearchAlbumsByName = async () => {
    try {
      setIsSearchingAlbums(true);
      const searchAlbumsResponse = await axios.get(
        `${API_URL}/search?searchString=${formValues.title}&itemType=album`
      );
      setFormValues({});
      setAlbums(searchAlbumsResponse.data.result);
    } catch (error) {
      setAlbums([]);
      setFormValues({});
      console.log('error', error);
    } finally {
      setIsSearchingAlbums(false);
    }
  };

  const getButtonText = () => {
    if (isFetchingAlbums) return 'Loading...';

    const parts = [];

    if (ratingFilter === 'RATED') {
      parts.push('Rated');
    } else if (ratingFilter === 'ALL') {
      parts.push('All');
    } else {
      parts.push(ratingFilter.charAt(0) + ratingFilter.slice(1).toLowerCase());
    }

    parts.push('Albums');

    if (yearFilter) {
      parts.push(`(${yearFilter})`);
    }

    return parts.join(' ');
  };

  return (
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">Albums</h1>
          <p className="text-neutral-600 max-w-md mx-auto">
            Explore your curated album collection with detailed ratings and
            comprehensive search
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:mx-4">
          <div className="flex gap-3">
            <select
              value={ratingFilter}
              onChange={(e) =>
                setRatingFilter(
                  e.target.value as 'RATED' | 'GOLD' | 'SILVER' | 'ALL'
                )
              }
              className="form-select-btn flex-1 min-w-0 sm:flex-none sm:w-52"
            >
              <option value="RATED">Rated</option>
              <option value="GOLD">Gold Only</option>
              <option value="SILVER">Silver Only</option>
              <option value="ALL">All</option>
            </select>

            <input
              type="number"
              inputMode="numeric"
              value={yearFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 4) {
                  setYearFilter(value);
                }
              }}
              placeholder="Year"
              className="form-control-btn w-24 shrink-0 sm:w-32"
            />
          </div>

          <div className="flex gap-2 sm:flex-1 sm:min-w-[16rem] [&_.form-group]:mb-0 [&_.form-group]:flex-1 [&_.form-group]:min-w-0">
            <InputField
              id="title"
              setFormValues={setFormValues}
              value={formValues['title']}
              showLabel={false}
              type="search"
              placeholder="Search albums..."
              size="btn"
            />

            <button
              onClick={handleSearchAlbumsByName}
              className="btn-search-secondary shrink-0"
              disabled={!formValues.title}
            >
              {isSearchingAlbums ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:mx-4">
          <button
            onClick={handleGetAlbums}
            className="btn-search-primary flex-1 sm:flex-none"
          >
            {getButtonText()}
          </button>

          {(ratingFilter !== 'RATED' || yearFilter) && (
            <button
              onClick={() => {
                setRatingFilter('RATED');
                setYearFilter('');
              }}
              className="btn-link-sm shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        <div className="layout-content">
          <AlbumsTable
            albums={albums}
            isLoading={isFetchingAlbums || isSearchingAlbums}
          />
        </div>
      </section>
    </div>
  );
};

export default AlbumsPage;
