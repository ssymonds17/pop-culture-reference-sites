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
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">
            Songs
          </h1>
          <p className="text-neutral-600">
            Search for individual songs in your music collection
          </p>
        </div>

        <div className="layout-flex-center">
          <div className="flex">
            <InputField
              id="title"
              setFormValues={setFormValues}
              value={formValues['title']}
              showLabel={false}
              type="search"
              placeholder="Search songs..."
              size="md"
            />
            <button
              onClick={handleSearchSongsByName}
              className="btn-primary-md mx-4"
              disabled={!formValues.title}
            >
              {isSearchingSongs ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="layout-content">
          <SongsTable songs={songs} isLoading={isSearchingSongs} />
        </div>
      </section>
    </div>
  );
};

export default SongsPage;
