'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';

const ArtistsPage = () => {
  const [artists, setArtists] = useState([]);

  const handleGetArtists = async () => {
    try {
      const getArtistsResponse = await axios.get(`${API_URL}/artists`);
      setArtists(getArtistsResponse.data.artist);
    } catch (error) {}
  };

  return (
    <div className="m-4">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Artists Page
      </h1>
      <div>
        <button
          onClick={handleGetArtists}
          className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-md"
        >
          Get All Artists
        </button>
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
