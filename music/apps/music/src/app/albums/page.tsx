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
    <div className="m-4">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Albums Page
      </h1>
      <div className="flex mt-4">
        <button
          onClick={handleGetAlbums}
          className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md"
        >
          {isFetchingAlbums ? 'Loading...' : 'Get All Albums'}
        </button>
        <div className="flex">
          <InputField
            id="title"
            setFormValues={setFormValues}
            value={formValues['title']}
            showLabel={false}
          />
          <button
            onClick={handleSearchAlbumsByName}
            className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md disabled:bg-gray-300"
            disabled={!formValues.title}
          >
            {isSearchingAlbums ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      <ul>
        <AlbumsTable albums={albums} />
      </ul>
    </div>
  );
};

export default AlbumsPage;
