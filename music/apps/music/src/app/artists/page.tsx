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
      setArtists(getArtistsResponse.data.artists);
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleSearchArtistByName = async () => {
    try {
      const searchArtistsResponse = await axios.get(
        `${API_URL}/search?searchString=${formValues.name}&itemType=artist`
      );
      setFormValues({});
      setArtists(searchArtistsResponse.data.result);
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
        <table className="w-full mt-4 table-auto border-collapse border border-gray-400">
          <tr>
            <th className="border border-gray-300">Name</th>
            <th className="border border-gray-300 text-center">Gold Albums</th>
            <th className="border border-gray-300 text-center">
              Silver Albums
            </th>
            <th className="border border-gray-300 text-center">Total Songs</th>
            <th className="border border-gray-300 text-center">Total Score</th>
          </tr>

          {artists ? (
            artists.map((artist: Artist) => (
              <tr key={artist.id}>
                <td className="border border-gray-300 text-center">
                  {artist.displayName}
                </td>
                <td className="border border-gray-300 text-center">
                  {artist.goldAlbums}
                </td>
                <td className="border border-gray-300 text-center">
                  {artist.silverAlbums}
                </td>
                <td className="border border-gray-300 text-center">
                  {artist.totalSongs}
                </td>
                <td className="border border-gray-300 text-center">
                  {artist.totalScore}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="border border-gray-300 text-center">
                No artists found
              </td>
            </tr>
          )}
        </table>
      </ul>
    </div>
  );
};

export default ArtistsPage;
