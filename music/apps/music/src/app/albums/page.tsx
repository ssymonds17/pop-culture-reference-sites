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
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'GOLD' | 'SILVER'>(
    'ALL'
  );
  const [yearFilter, setYearFilter] = useState<string>('');
  useScrollToTop();

  const handleGetAlbums = async () => {
    try {
      setIsFetchingAlbums(true);

      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (ratingFilter !== 'ALL') {
        params.append('rating', ratingFilter);
      }
      if (yearFilter) {
        params.append('year', yearFilter);
      }

      const queryString = params.toString();
      const url = `${API_URL}/albums${queryString ? `?${queryString}` : ''}`;

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

    if (ratingFilter !== 'ALL') {
      parts.push(ratingFilter.charAt(0) + ratingFilter.slice(1).toLowerCase());
    } else {
      parts.push('All');
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

        <div className="flex items-center gap-4 mx-4 mb-4">
          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(e.target.value as 'ALL' | 'GOLD' | 'SILVER')
            }
            className="form-select-btn w-52"
          >
            <option value="ALL">All</option>
            <option value="GOLD">Gold Only</option>
            <option value="SILVER">Silver Only</option>
          </select>

          <input
            type="number"
            value={yearFilter}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 4) {
                setYearFilter(value);
              }
            }}
            placeholder="Year"
            className="form-control-btn w-32"
          />

          <div className="flex [&_.form-group]:mb-0">
            <InputField
              id="title"
              setFormValues={setFormValues}
              value={formValues['title']}
              showLabel={false}
              type="search"
              placeholder="Search albums..."
              size="btn"
            />
          </div>

          <button
            onClick={handleSearchAlbumsByName}
            className="btn-search-secondary"
            disabled={!formValues.title}
          >
            {isSearchingAlbums ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="layout-flex-between">
          <button onClick={handleGetAlbums} className="btn-search-primary mx-4">
            {getButtonText()}
          </button>

          {(ratingFilter !== 'ALL' || yearFilter) && (
            <button
              onClick={() => {
                setRatingFilter('ALL');
                setYearFilter('');
              }}
              className="btn-link-sm mx-4"
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
