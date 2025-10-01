import { Song } from '../../../types';
import { SongsTable } from '../Songs';

export const SongBlock = ({
  songs,
  isLoading,
}: {
  songs: Song[];
  isLoading: boolean;
}) => {
  return (
    <>
      <div className="flex">
        <h2 className="text-2xl font-semibold mt-6">Songs</h2>
        {!isLoading && (
          <div className="flex-col marginitems-center justify-center mt-6 ml-2">
            <button
              className="flex flex-col marginitems-center justify-center border-2 w-7 h-7 rounded-full bg-blue-500 text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors duration-200 ml-2 hover:pointer"
              type="button"
            >
              +
            </button>
          </div>
        )}
      </div>
      <SongsTable songs={songs} isLoading={isLoading} />
    </>
  );
};
