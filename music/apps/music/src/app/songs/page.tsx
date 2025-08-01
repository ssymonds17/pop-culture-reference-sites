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

  const handleSearchSongsByName = async () => {
    try {
      const searchSongsResponse = await axios.get(
        `${API_URL}/search?searchString=${formValues.title}&itemType=song`
      );
      setFormValues({});
      setSongs(searchSongsResponse.data.result);
    } catch (error) {
      setSongs([]);
      setFormValues({});
      console.log('error', error);
    }
  };

  return (
    <div className="m-4">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Songs Page
      </h1>
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
            className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md"
          >
            Search
          </button>
        </div>
      </div>
      <ul>
        <SongsTable songs={songs} />
      </ul>
    </div>
  );
};

export default SongsPage;
