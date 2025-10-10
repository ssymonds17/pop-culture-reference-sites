'use client';

import { useState } from 'react';
import { Song, Variation } from '../../../types';
import { SongsTable } from '../Songs';
import { Modal } from '../../Modal';

export const SongBlock = ({
  defaultValues,
  songs,
  isLoading,
}: {
  defaultValues: Partial<Song>;
  songs: Song[];
  isLoading: boolean;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div className="flex">
        <h2 className="text-2xl font-semibold mt-6">Songs</h2>
        {!isLoading && (
          <div className="flex-col marginitems-center justify-center mt-6 ml-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-icon-sm btn-primary ml-2"
              type="button"
            >
              +
            </button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              variation={Variation.SONG}
              label="Add Song"
              defaultValues={defaultValues}
              isQuickAdd={true}
            />
          </div>
        )}
      </div>
      <SongsTable songs={songs} isLoading={isLoading} />
    </>
  );
};
