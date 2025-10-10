'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { InputField } from '../../components/InputField';
import { Album } from '../../types';
import { AlbumsTable } from '../../components';

const AlbumsPage = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [formValues, setFormValues] = useState<Partial<Album>>({});
  const [isFetchingAlbums, setIsFetchingAlbums] = useState(false);
  const [isSearchingAlbums, setIsSearchingAlbums] = useState(false);

  const handleGetAlbums = async () => {
    try {
      setIsFetchingAlbums(true);
      const getAlbumsResponse = await axios.get(`${API_URL}/albums`);
      setAlbums(getAlbumsResponse.data.albums);
    } catch (error) {
      setAlbums([]);
      setFormValues({});
      console.log('error', error);
    } finally {
      setIsFetchingAlbums(false);
    }
  };

  const handleSearchAlbumsByName = async () => {
    try {
      setIsSearchingAlbums(true);
      const searchAlbumsResponse = await axios.get(
        `${API_URL}/search?searchString=${formValues.title}&itemType=album`
      );
      setFormValues({});
      setAlbums(searchAlbumsResponse.data.result);
    } catch (error) {
      setAlbums([]);
      setFormValues({});
      console.log('error', error);
    } finally {
      setIsSearchingAlbums(false);
    }
  };

  return (
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">Albums</h1>
          <p className="text-neutral-600 max-w-md mx-auto">
            Explore your curated album collection with detailed ratings and comprehensive search
          </p>
        </div>

        <div className="layout-flex-between">
          <button
            onClick={handleGetAlbums}
            className="btn-primary-md mx-4"
          >
            {isFetchingAlbums ? 'Loading...' : 'Get All Albums'}
          </button>
          <div className="flex">
            <InputField
              id="title"
              setFormValues={setFormValues}
              value={formValues['title']}
              showLabel={false}
              type="search"
              placeholder="Search albums..."
              size="btn"
            />
            <button
              onClick={handleSearchAlbumsByName}
              className="btn-secondary-md mx-4"
              disabled={!formValues.title}
            >
              {isSearchingAlbums ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="layout-content">
          <AlbumsTable
            albums={albums}
            isLoading={isFetchingAlbums || isSearchingAlbums}
          />
        </div>
      </section>
    </div>
  );
};

export default AlbumsPage;
