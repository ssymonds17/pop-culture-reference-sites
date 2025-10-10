'use client';

import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { InputField } from '../InputField';
import { Album, Artist, Variation, Rating } from '../../types';
import { RatingSelector } from '../Rating';
import { Search } from '../Search';

export const AlbumFormFields = ({
  formValues,
  setFormValues,
  isQuickAdd = false,
}: {
  formValues: Partial<Album>;
  setFormValues: Dispatch<SetStateAction<Partial<Album>>>;
  isQuickAdd?: boolean;
}) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const handleSetArtists = (newArtist: Artist) => {
    const newArtists = [...artists, newArtist];
    setArtists(newArtists);
    setFormValues((prevValues) => ({
      ...prevValues,
      artists: newArtists.map((artist) => artist._id),
    }));
  };

  useEffect(() => {
    if (Object.keys(formValues).length === 0) {
      setArtists([]);
    }
  }, [formValues]);

  return (
    <div>
      <InputField
        id="title"
        value={formValues['title']}
        setFormValues={setFormValues}
        placeholder="Enter album title..."
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
            placeholder="Display name for artist(s)..."
          />
          <div className="form-group">
            <label className="form-label">Rating</label>
            <RatingSelector
              currentRating={formValues.rating || Rating.NONE}
              onChange={(rating) => setFormValues((prev) => ({ ...prev, rating }))}
              size="md"
            />
          </div>
        </>
      )}
    </div>
  );
};
