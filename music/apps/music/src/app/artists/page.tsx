'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { InputField } from '../../components/InputField';
import { Artist } from '../../types';

const ArtistsPage = () => {
  const [artists, setArtists] = useState([]);
  const [formValues, setFormValues] = useState<Partial<Artist>>({});

  const handleGetArtists = async () => {
    try {
      const getArtistsResponse = await axios.get(`${API_URL}/artists`);
      setArtists(getArtistsResponse.data.artist);
    } catch (error) {}
  };

  const handleSearchArtistByName = async () => {
    try {
      const searchArtistsResponse = await axios.get(
        `${API_URL}/artists/name/search?name=${formValues['name']}`
      );
      setArtists(searchArtistsResponse.data.artist);
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <div className="m-4">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Artists Page
      </h1>
      <div className="flex mt-4">
        <button
          onClick={handleGetArtists}
          className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md"
        >
          Get All Artists
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
            className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md"
          >
            Search
          </button>
        </div>
      </div>
      <ul>
        {artists
          ? artists.map((artist: any) => <li key={artist.id}>{artist.name}</li>)
          : null}
      </ul>
    </div>
  );
};

export default ArtistsPage;
