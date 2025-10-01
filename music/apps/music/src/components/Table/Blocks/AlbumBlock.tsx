'use client';

import { useState } from 'react';
import { Album, ArtistFull, Rating, Variation } from '../../../types';
import { AlbumsTable } from '../Albums';
import { Modal } from '../../Modal';

export const AlbumBlock = ({
  artist,
  albums,
  isLoading,
}: {
  artist: ArtistFull | null;
  albums: Album[];
  isLoading: boolean;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div className="flex">
        <h2 className="text-2xl font-semibold mt-6">Albums</h2>
        {!isLoading && (
          <div className="flex-col marginitems-center justify-center mt-6 ml-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex flex-col marginitems-center justify-center border-2 w-7 h-7 rounded-full bg-blue-500 text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors duration-200 ml-2 hover:pointer"
              type="button"
            >
              +
            </button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              variation={Variation.ALBUM}
              label="Add Album"
              defaultValues={
                {
                  artists: [artist?._id],
                  artistDisplayName: artist?.displayName,
                  rating: Rating.NONE,
                } as Partial<Album>
              }
              isQuickAdd={true}
            />
          </div>
        )}
      </div>
      <AlbumsTable albums={albums} isLoading={isLoading} />
    </>
  );
};
