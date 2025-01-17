'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_URL } from '../../constants';

const ArtistsPage = () => {
  const [artist, setArtist] = useState(null);

  const getArtist = async (id: string) => {
    const getArtistResponse = await axios.get(`${API_URL}/artists/${id}`);

    return getArtistResponse.data.artist;
  };

  useEffect(() => {
    const artist = getArtist('12345678910');

    console.log('ARTIST', artist);
  }, []);

  return (
    <h1 className="text-4xl font-bold text-center text-gray-900">
      Artists Page
      <p>{artist}</p>
    </h1>
  );
};

export default ArtistsPage;
