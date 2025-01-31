'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_URL } from '../../constants';

const ArtistsPage = () => {
  const [artists, setArtists] = useState([]);

  const handleGetArtists = async () => {
    try {
      const getArtistsResponse = await axios.get(`${API_URL}/artists`);
      setArtists(getArtistsResponse.data.artist);
    } catch (error) {}
  };

  useEffect(() => {
    handleGetArtists();
  }, []);

  return (
    <>
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Artists Page
      </h1>
      <ul>
        {artists
          ? artists.map((artist: any) => <li key={artist.id}>{artist.name}</li>)
          : null}
      </ul>
    </>
  );
};

export default ArtistsPage;
