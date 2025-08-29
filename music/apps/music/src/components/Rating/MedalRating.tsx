import React from 'react';
import { Rating } from '../../types';

interface MedalProps {
  albumId: string;
  medalRating: Rating;
  active: boolean;
  onClick?: (albumId: string, newRating: Rating) => void;
}

const medalColors = {
  [Rating.GOLD]: '#FFD700',
  [Rating.SILVER]: '#BFE1F6',
  [Rating.NONE]: '#E0E0E0',
};

const Medal: React.FC<MedalProps> = ({
  albumId,
  medalRating,
  active,
  onClick,
}) => {
  const color = active ? medalColors[medalRating] : medalColors[Rating.NONE];
  return (
    <button
      onClick={() => onClick?.(albumId, medalRating)}
      type="button"
      aria-label={medalRating + ' medal'}
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: color,
        margin: 4,
        border: '1px solid #FFF',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? '0 0 4px 1px #aaa' : undefined,
        padding: 0,
        outline: 'none',
      }}
      tabIndex={onClick ? 0 : -1}
      disabled={!onClick}
    />
  );
};

interface MedalRatingProps {
  albumId: string;
  albumRating: Rating;
  medalRating: Rating;
  handleOnClick?: (albumId: string, newRating: Rating) => void;
}

export const MedalRating: React.FC<MedalRatingProps> = ({
  albumId,
  albumRating,
  medalRating,
  handleOnClick,
}) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <Medal
      albumId={albumId}
      medalRating={medalRating}
      active={albumRating === medalRating}
      onClick={() =>
        handleOnClick?.(
          albumId,
          albumRating === medalRating ? Rating.NONE : medalRating
        )
      }
    />
  </div>
);
