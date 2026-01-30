interface SongProgressProps {
  currentSongs: number;
  totalSongs?: number;
  size?: 'sm' | 'md' | 'lg';
  showBar?: boolean;
  className?: string;
}

const getProgressColor = (current: number, total: number) => {
  if (!total || total === 0) return 'text-neutral-500 bg-neutral-100';

  const percentage = (current / total) * 100;

  if (percentage >= 75) return 'text-music-600 bg-music-100';
  if (percentage >= 50) return 'text-amber-600 bg-amber-100';
  if (percentage >= 25) return 'text-orange-600 bg-orange-100';
  return 'text-red-500 bg-red-100';
};

const getBarColor = (current: number, total: number) => {
  if (!total || total === 0) return 'bg-neutral-400';

  const percentage = (current / total) * 100;

  if (percentage >= 75) return 'bg-music-500';
  if (percentage >= 50) return 'bg-amber-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        text: 'text-sm',
        padding: 'px-2 py-1',
        bar: 'h-1'
      };
    case 'lg':
      return {
        text: 'text-lg',
        padding: 'px-4 py-2',
        bar: 'h-3'
      };
    default: // md
      return {
        text: 'text-base',
        padding: 'px-3 py-1.5',
        bar: 'h-2'
      };
  }
};

export const SongProgress = ({
  currentSongs,
  totalSongs,
  size = 'md',
  showBar = false,
  className = ''
}: SongProgressProps) => {
  const progressColor = totalSongs
    ? getProgressColor(currentSongs, totalSongs)
    : 'text-neutral-500 bg-neutral-100';
  const barColor = totalSongs
    ? getBarColor(currentSongs, totalSongs)
    : 'bg-neutral-400';
  const sizeClasses = getSizeClasses(size);
  const percentage = totalSongs ? Math.min((currentSongs / totalSongs) * 100, 100) : 0;

  const displayText = totalSongs ? `${currentSongs}/${totalSongs}` : `${currentSongs}`;

  if (showBar && totalSongs) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`${barColor} ${sizeClasses.bar} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={`font-mono font-bold ${sizeClasses.text} ${progressColor.split(' ')[0]}`}>
            {displayText}
          </span>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-mono font-bold rounded-md
        ${sizeClasses.text}
        ${sizeClasses.padding}
        ${progressColor}
        ${className}
      `}
    >
      {displayText}
    </span>
  );
};

// Compact version for tables
export const SongProgressBadge = ({
  currentSongs,
  totalSongs,
  size = 'sm',
  className = ''
}: Pick<SongProgressProps, 'currentSongs' | 'totalSongs' | 'size' | 'className'>) => {
  return (
    <SongProgress
      currentSongs={currentSongs}
      totalSongs={totalSongs}
      size={size}
      className={className}
    />
  );
};
