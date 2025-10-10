'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { InputField } from '../../components/InputField';
import { Artist } from '../../types';
import { ArtistsTable } from '../../components/Table/Artist';

const ArtistsPage = () => {
  const [artists, setArtists] = useState([]);
  const [formValues, setFormValues] = useState<Partial<Artist>>({});
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [shouldRankArtists, setShouldRankArtists] = useState(false);

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
          <h1 className="mb-component-sm">
            Artists
          </h1>
          <p className="text-neutral-600">
            Browse and search through your music artist collection
          </p>
        </div>

        <div className="layout-flex-between">
          <button
            onClick={handleGetArtists}
            className="min-w-100px mx-4 px-4 py-2 text-white bg-blue-500 rounded-md cursor-pointer "
          >
            {isFetchingArtists ? 'Loading...' : 'Get All Artists'}
          </button>
          <div className="flex">
            <InputField
              id="name"
              setFormValues={setFormValues}
              value={formValues['name']}
              showLabel={false}
            />
            <button
              onClick={handleSearchArtistByName}
              className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md disabled:bg-gray-300"
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
