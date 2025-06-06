'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import { InputField } from '../InputField';
import { Album, Artist, Song, Variation } from '../../types';
import { Search } from '../Search';

export const SongFormFields = ({
  formValues,
  setFormValues,
}: {
  formValues: Partial<Song>;
  setFormValues: Dispatch<SetStateAction<Partial<Song>>>;
}) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const handleSetArtists = (newArtist: Artist) => {
    const newArtists = [...artists, newArtist];
    setArtists(newArtists);
    setFormValues((prevValues) => ({
      ...prevValues,
      artists: newArtists.map((artist) => artist.id),
    }));
  };
  const [album, setAlbum] = useState<Album | undefined>(undefined);
  const handleSetAlbum = (newAlbum: Album) => {
    setAlbum(newAlbum);
    setFormValues((prevValues) => ({
      ...prevValues,
      album: newAlbum.id,
    }));
  };

  return (
    <div>
      <InputField
        id="title"
        value={formValues['title']}
        setFormValues={setFormValues}
      />
      <InputField
        id="year"
        value={formValues['year']}
        setFormValues={setFormValues}
      />
      <Search
        id="artists"
        variation={Variation.ARTIST}
        setSearchResult={handleSetArtists}
      />
      {artists.length > 0 && (
        <div>
          <ul className="flex flex-col gap-2 p-2">
            {artists.map((artist) => (
              <li key={artist.id} className="border-2 p-1">
                {artist.displayName}
              </li>
            ))}
          </ul>
        </div>
      )}
      <InputField
        id="artistDisplayName"
        value={formValues['artistDisplayName']}
        setFormValues={setFormValues}
      />
      <Search
        id="albums"
        variation={Variation.ALBUM}
        setSearchResult={handleSetAlbum}
      />
      {album && (
        <div>
          <ul className="flex flex-col gap-2 p-2">
            <li key={album.id} className="border-2 p-1">
              ({album.year}) {album.displayTitle} - {album.artistDisplayName}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
