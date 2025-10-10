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
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-center mb-2">
          Artists
        </h1>
        <p className="text-center text-neutral-600">
          Browse and search through your music artist collection
        </p>
      </div>
      <div className="flex mt-4">
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
      <ul className="mt-4">
        <ArtistsTable
          artists={artists}
          isLoading={isFetchingArtists || isSearchingArtists}
          isRanked={shouldRankArtists}
        />
      </ul>
    </div>
  );
};

export default ArtistsPage;
