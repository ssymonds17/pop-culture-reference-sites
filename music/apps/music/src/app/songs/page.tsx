'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { InputField } from '../../components/InputField';
import { Song } from '../../types';
import { SongsTable } from '../../components';

const SongsPage = () => {
  const [songs, setSongs] = useState([]);
  const [formValues, setFormValues] = useState<Partial<Song>>({});
  const [isSearchingSongs, setIsSearchingSongs] = useState(false);

  const handleSearchSongsByName = async () => {
    try {
      setIsSearchingSongs(true);
      const searchSongsResponse = await axios.get(
        `${API_URL}/search?searchString=${formValues.title}&itemType=song`
      );
      setFormValues({});
      setSongs(searchSongsResponse.data.result);
    } catch (error) {
      setSongs([]);
      setFormValues({});
      console.log('error', error);
    } finally {
      setIsSearchingSongs(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-center mb-2">
          Songs
        </h1>
        <p className="text-center text-neutral-600">
          Search for individual songs in your music collection
        </p>
      </div>
      <div className="flex mt-4">
        <div className="flex">
          <InputField
            id="title"
            setFormValues={setFormValues}
            value={formValues['title']}
            showLabel={false}
          />
          <button
            onClick={handleSearchSongsByName}
            className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md disabled:bg-gray-300"
            disabled={!formValues.title}
          >
            {isSearchingSongs ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      <ul className="mt-4">
        <SongsTable songs={songs} isLoading={isSearchingSongs} />
      </ul>
    </div>
  );
};

export default SongsPage;
