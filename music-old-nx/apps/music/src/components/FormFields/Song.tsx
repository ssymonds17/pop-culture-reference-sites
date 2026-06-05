'use client';

import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { InputField } from '../InputField';
import { Album, Artist, Song, Variation } from '../../types';
import { Search } from '../Search';

export const SongFormFields = ({
  formValues,
  setFormValues,
  isQuickAdd = false,
}: {
  formValues: Partial<Song>;
  setFormValues: Dispatch<SetStateAction<Partial<Song>>>;
  isQuickAdd?: boolean;
}) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [album, setAlbum] = useState<Album | undefined>(undefined);

  const handleSetArtists = (newArtist: Artist) => {
    const newArtists = [...artists, newArtist];
    setArtists(newArtists);
    setFormValues((prevValues) => ({
      ...prevValues,
      artists: newArtists.map((artist) => artist._id),
    }));
  };
  const handleSetAlbum = (newAlbum: Album) => {
    setAlbum(newAlbum);
    setFormValues((prevValues) => ({
      ...prevValues,
      album: newAlbum._id,
      albumDisplayTitle: newAlbum.displayTitle,
    }));
  };

  useEffect(() => {
    if (Object.keys(formValues).length === 0) {
      setArtists([]);
      setAlbum(undefined);
    }
  }, [formValues]);

  return (
    <div>
      <InputField
        id="title"
        value={formValues['title']}
        setFormValues={setFormValues}
        placeholder="Enter song title..."
        required={true}
      />
      <InputField
        id="year"
        value={formValues['year']}
        setFormValues={setFormValues}
        type="number"
        placeholder="Enter release year..."
        required={true}
      />
      {!isQuickAdd && (
        <>
          <Search
            id="albums"
            variation={Variation.ALBUM}
            setSearchResult={handleSetAlbum}
          />
          {album && (
            <div className="form-group">
              <label className="form-label">Selected Album</label>
              <div className="component-card">
                <div className="font-medium text-music-600">{album.displayTitle}</div>
                <div className="text-sm text-neutral-500">
                  {album.artistDisplayName} • {album.year}
                </div>
              </div>
            </div>
          )}
          <Search
            id="artists"
            variation={Variation.ARTIST}
            setSearchResult={handleSetArtists}
          />
          {artists.length > 0 && (
            <div className="form-group">
              <label className="form-label">Selected Artists</label>
              <div className="component-card">
                <div className="space-y-1">
                  {artists.map((artist, index) => (
                    <div key={artist._id} className="flex items-center">
                      <span className="font-medium text-music-600">
                        {artist.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <InputField
            id="artistDisplayName"
            value={formValues['artistDisplayName']}
            setFormValues={setFormValues}
          />
        </>
      )}
    </div>
  );
};
