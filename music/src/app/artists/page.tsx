'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { InputField } from '../../components/InputField';
import { Artist } from '../../types';
import { ArtistsTable } from '../../components/Table/Artist';
import { useScrollToTop } from '../../utils';

const ArtistsPage = () => {
  const [artists, setArtists] = useState([]);
  const [formValues, setFormValues] = useState<Partial<Artist>>({});
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [shouldRankArtists, setShouldRankArtists] = useState(false);
  useScrollToTop();

  const handleGetArtists = async () => {
    try {
      setIsFetchingArtists(true);
      const getArtistsResponse = await axios.get(`${API_URL}/artists`);
      const artistsVariousFiltered = getArtistsResponse.data.artists.filter(
        (artist: Artist) => artist.displayName !== 'Various Artists'
      );
      setArtists(artistsVariousFiltered);
      setShouldRankArtists(true);
    } catch (error) {
      setArtists([]);
      setFormValues({});
      setShouldRankArtists(false);
      console.log('error', error);
    } finally {
      setIsFetchingArtists(false);
    }
  };

  const handleSearchArtistByName = async () => {
    try {
      setIsSearchingArtists(true);
      const searchArtistsResponse = await axios.get(
        `${API_URL}/search?searchString=${formValues.name}&itemType=artist`
      );
      setFormValues({});
      const artistsVariousFiltered = searchArtistsResponse.data.result.filter(
        (artist: Artist) => artist.displayName !== 'Various Artists'
      );
      setArtists(artistsVariousFiltered);
    } catch (error) {
      setArtists([]);
      setFormValues({});
      console.log('error', error);
    } finally {
      setIsSearchingArtists(false);
      setShouldRankArtists(false);
    }
  };

  return (
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">Artists</h1>
          <p className="text-neutral-600 max-w-md mx-auto">
            Discover talented artists in your music library with comprehensive
            rankings and statistics
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
          <button
            onClick={handleGetArtists}
            className="btn-search-primary w-full sm:w-auto sm:min-w-[100px]"
          >
            {isFetchingArtists ? 'Loading...' : 'Get All Artists'}
          </button>
          <div className="flex gap-2 w-full sm:w-auto [&_.form-group]:mb-0 [&_.form-group]:flex-1 [&_.form-group]:min-w-0">
            <InputField
              id="name"
              setFormValues={setFormValues}
              value={formValues['name']}
              showLabel={false}
              type="search"
              placeholder="Search artists..."
              size="btn"
            />
            <button
              onClick={handleSearchArtistByName}
              className="btn-search-secondary shrink-0"
              disabled={!formValues.name}
            >
              {isSearchingArtists ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="layout-content">
          <ArtistsTable
            artists={artists}
            isLoading={isFetchingArtists || isSearchingArtists}
            isRanked={shouldRankArtists}
          />
        </div>
      </section>
    </div>
  );
};

export default ArtistsPage;
