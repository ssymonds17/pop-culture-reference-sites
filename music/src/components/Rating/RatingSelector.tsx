'use client';

import { useState } from 'react';
import { Rating } from '../../types';

interface RatingSelectorProps {
  currentRating: Rating;
  onChange: (rating: Rating) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showLabels?: boolean;
  className?: string;
}

const getRatingConfig = (
  rating: Rating,
  isActive: boolean,
  isHovered: boolean
) => {
  const base = {
    [Rating.GOLD]: {
      icon: '🥇',
      activeClass:
        'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-300 shadow-md',
      inactiveClass:
        'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100',
      label: 'Gold',
    },
    [Rating.SILVER]: {
      icon: '🥈',
      activeClass:
        'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 border-gray-400 shadow-md',
      inactiveClass:
        'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
      label: 'Silver',
    },
    [Rating.NONE]: {
      icon: '○',
      activeClass: 'bg-neutral-200 text-neutral-700 border-neutral-300',
      inactiveClass:
        'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100',
      label: 'None',
    },
  }[rating];

  const classes = isActive ? base.activeClass : base.inactiveClass;
  const hoverEffect = !isActive && isHovered ? 'scale-105 shadow-sm' : '';

  return {
    ...base,
    classes: `${classes} ${hoverEffect}`.trim(),
  };
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        button: 'w-12 h-8 text-xs',
        icon: 'text-sm',
        gap: 'gap-2',
      };
    case 'lg':
      return {
        button: 'w-20 h-12 text-base',
        icon: 'text-xl',
        gap: 'gap-4',
      };
    default: // md
      return {
        button: 'w-16 h-10 text-sm',
        icon: 'text-base',
        gap: 'gap-3',
      };
  }
};

export const RatingSelector = ({
  currentRating,
  onChange,
  size = 'md',
  disabled = false,
  showLabels = true,
  className = '',
}: RatingSelectorProps) => {
  const [hoveredRating, setHoveredRating] = useState<Rating | null>(null);
  const sizeClasses = getSizeClasses(size);
  const ratings = [Rating.GOLD, Rating.SILVER, Rating.NONE];

  const handleRatingClick = (rating: Rating) => {
    if (disabled) return;

    // Toggle behavior: clicking the same rating deselects it
    if (currentRating === rating) {
      onChange(Rating.NONE);
    } else {
      onChange(rating);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`flex items-center ${sizeClasses.gap}`}>
        {ratings.map((rating) => {
          const isActive = currentRating === rating;
          const isHovered = hoveredRating === rating;
          const config = getRatingConfig(rating, isActive, isHovered);

          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleRatingClick(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(null)}
              disabled={disabled}
              className={`
                flex items-center justify-center
                border rounded-lg font-medium
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-music-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${sizeClasses.button}
                ${config.classes}
              `}
              aria-label={`Set rating to ${config.label}`}
              title={config.label}
            >
              <span className={sizeClasses.icon}>{config.icon}</span>
            </button>
          );
        })}
      </div>

      {showLabels && (
        <div className={`flex items-center ${sizeClasses.gap}`}>
          {ratings.map((rating) => {
            const config = getRatingConfig(rating, false, false);
            const isActive = currentRating === rating;

            return (
              <div
                key={`${rating}-label`}
                className={`
                  text-center text-xs
                  ${sizeClasses.button
                    .replace('h-10', '')
                    .replace('h-8', '')
                    .replace('h-12', '')}
                  ${
                    isActive
                      ? 'font-semibold text-music-600'
                      : 'text-neutral-500'
                  }
                `}
              >
                {config.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Compact inline version for tables
export const InlineRatingSelector = ({
  currentRating,
  onChange,
  disabled = false,
  className = '',
}: Pick<
  RatingSelectorProps,
  'currentRating' | 'onChange' | 'disabled' | 'className'
>) => {
  const ratings = [Rating.GOLD, Rating.SILVER, Rating.NONE];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {ratings.map((rating) => {
        const isActive = currentRating === rating;
        const config = getRatingConfig(rating, isActive, false);

        return (
          <button
            key={rating}
            type="button"
            onClick={() =>
              onChange(rating === currentRating ? Rating.NONE : rating)
            }
            disabled={disabled}
            className={`
              w-6 h-6 flex items-center justify-center
              border rounded text-xs
              transition-all duration-150
              hover:scale-110 focus:outline-none focus:ring-1 focus:ring-music-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${config.classes}
            `}
            title={config.label}
          >
            <span className="text-xs">{config.icon}</span>
          </button>
        );
      })}
    </div>
  );
};
